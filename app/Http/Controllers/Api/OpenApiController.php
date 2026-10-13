<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaravelJsonApi\Core\Server\ServerRepository;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Fields\Attribute;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\Relation;
use LaravelJsonApi\Eloquent\Fields\Relations\ToMany;
use LaravelJsonApi\Eloquent\Schema;

class OpenApiController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $baseUrl = config('app.url');
        $server = app(ServerRepository::class)->server('v1');
        $schemaContainer = $server->schemas();

        $paths = [];
        $componentsSchemas = [];

        foreach ($schemaContainer->types() as $resourceType) {
            $schema = $schemaContainer->schemaFor($resourceType);

            if (! $schema instanceof Schema) {
                continue;
            }

            $type = $resourceType;
            $attributesProps = [];
            $relationshipsProps = [];
            $relationNames = [];
            $requiredAttrs = [];

            foreach ($schema->fields() as $field) {
                if ($field instanceof Attribute) {
                    $fieldName = $field->name();
                    $attrSchema = $this->mapFieldToOpenApiSchema($field);

                    $attributesProps[$fieldName] = $attrSchema;

                    $isReadOnly = false;
                    try {
                        $isReadOnly = method_exists($field, 'isReadOnly') && $field->isReadOnly();
                    } catch (\Throwable $e) {
                        $isReadOnly = false;
                    }

                    if (! $isReadOnly && $fieldName !== 'id') {
                        $requiredAttrs[] = $fieldName;
                    }
                } elseif ($field instanceof Relation) {
                    $relName = $field->name();
                    $relationNames[] = $relName;
                    
                    $targetType = $relName;
                    try {
                        if (method_exists($field, 'inverse')) {
                            $targetType = $field->inverse();
                        } elseif (method_exists($field, 'type')) {
                            $targetType = $field->type($schema);
                        }
                    } catch (\Throwable $e) {
                        // Fallback
                    }

                    if (is_array($targetType)) {
                        $targetType = reset($targetType) ?: $relName;
                    }

                    $isToMany = false;
                    try {
                        if ($field instanceof ToMany) {
                            $isToMany = true;
                        } elseif (method_exists($field, 'isToMany')) {
                            $isToMany = $field->isToMany();
                        }
                    } catch (\Throwable $e) {
                        $isToMany = false;
                    }

                    if ($isToMany) {
                        $relationshipsProps[$relName] = [
                            'type' => 'object',
                            'properties' => [
                                'data' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'type' => ['type' => 'string', 'example' => (string) $targetType],
                                            'id' => ['type' => 'string', 'example' => '1'],
                                        ],
                                    ],
                                ],
                            ],
                        ];
                    } else {
                        $relationshipsProps[$relName] = [
                            'type' => 'object',
                            'properties' => [
                                'data' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'type' => ['type' => 'string', 'example' => (string) $targetType],
                                        'id' => ['type' => 'string', 'example' => '1'],
                                    ],
                                ],
                            ],
                        ];
                    }
                }
            }

            $resourceSchemaName = str_replace(' ', '', ucwords(str_replace('-', ' ', $type))) . 'Resource';

            $componentsSchemas[$resourceSchemaName] = [
                'type' => 'object',
                'required' => ['id', 'type', 'attributes'],
                'properties' => [
                    'id' => ['type' => 'string', 'example' => '1'],
                    'type' => ['type' => 'string', 'example' => $type],
                    'attributes' => [
                        'type' => 'object',
                        'properties' => $attributesProps,
                    ],
                    'relationships' => [
                        'type' => 'object',
                        'properties' => $relationshipsProps,
                    ],
                    'links' => [
                        'type' => 'object',
                        'properties' => [
                            'self' => ['type' => 'string', 'example' => rtrim($baseUrl, '/') . "/api/v1/{$type}/1"],
                        ],
                    ],
                ],
            ];

            // Filter parameters
            $filterParams = [];
            if (method_exists($schema, 'filters')) {
                foreach ($schema->filters() as $filter) {
                    $filterKey = $filter->key();
                    $filterParams[] = [
                        'name' => "filter[{$filterKey}]",
                        'in' => 'query',
                        'required' => false,
                        'description' => "Filter {$type} by {$filterKey}",
                        'schema' => ['type' => 'string'],
                    ];
                }
            }

            // General parameters for list endpoint
            $queryParams = array_merge([
                [
                    'name' => 'page[number]',
                    'in' => 'query',
                    'required' => false,
                    'description' => 'Page number for pagination',
                    'schema' => ['type' => 'integer', 'default' => 1],
                ],
                [
                    'name' => 'page[size]',
                    'in' => 'query',
                    'required' => false,
                    'description' => 'Number of items per page',
                    'schema' => ['type' => 'integer', 'default' => 25],
                ],
                [
                    'name' => 'include',
                    'in' => 'query',
                    'required' => false,
                    'description' => count($relationNames) > 0
                        ? 'Include related resources (comma-separated). Allowed: ' . implode(', ', $relationNames)
                        : 'Include related resources (comma-separated)',
                    'schema' => ['type' => 'string'],
                ],
                [
                    'name' => 'sort',
                    'in' => 'query',
                    'required' => false,
                    'description' => 'Sort fields (prefix with - for descending order)',
                    'schema' => ['type' => 'string'],
                ],
            ], $filterParams);

            $paths["/{$type}"] = [
                'get' => [
                    'tags' => [$type],
                    'summary' => "List all {$type}",
                    'description' => "Retrieve a paginated list of {$type} resources according to JSON:API specification.",
                    'parameters' => $queryParams,
                    'responses' => [
                        '200' => [
                            'description' => "List of {$type} retrieved successfully",
                            'content' => [
                                'application/vnd.api+json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'data' => [
                                                'type' => 'array',
                                                'items' => [
                                                    '$ref' => "#/components/schemas/{$resourceSchemaName}",
                                                ],
                                            ],
                                            'meta' => ['type' => 'object'],
                                            'links' => ['type' => 'object'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        '401' => ['$ref' => '#/components/responses/UnauthorizedError'],
                        '403' => ['$ref' => '#/components/responses/ForbiddenError'],
                    ],
                ],
                'post' => [
                    'tags' => [$type],
                    'summary' => "Create a new {$type}",
                    'description' => "Create a new {$type} resource.",
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['data'],
                                    'properties' => [
                                        'data' => [
                                            'type' => 'object',
                                            'required' => ['type', 'attributes'],
                                            'properties' => [
                                                'type' => ['type' => 'string', 'example' => $type],
                                                'attributes' => [
                                                    'type' => 'object',
                                                    'properties' => array_filter($attributesProps, fn ($k) => ! in_array($k, ['createdAt', 'updatedAt']), ARRAY_FILTER_USE_KEY),
                                                ],
                                                'relationships' => [
                                                    'type' => 'object',
                                                    'properties' => $relationshipsProps,
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'responses' => [
                        '201' => [
                            'description' => "{$type} created successfully",
                            'content' => [
                                'application/vnd.api+json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'data' => ['$ref' => "#/components/schemas/{$resourceSchemaName}"],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        '422' => ['$ref' => '#/components/responses/ValidationError'],
                        '401' => ['$ref' => '#/components/responses/UnauthorizedError'],
                    ],
                ],
            ];

            $paths["/{$type}/{id}"] = [
                'get' => [
                    'tags' => [$type],
                    'summary' => "Fetch a single {$type}",
                    'description' => "Retrieve a single {$type} by ID.",
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'description' => "Unique identifier of the {$type}",
                            'schema' => ['type' => 'string'],
                        ],
                        [
                            'name' => 'include',
                            'in' => 'query',
                            'required' => false,
                            'description' => count($relationNames) > 0
                                ? 'Include related resources. Allowed: ' . implode(', ', $relationNames)
                                : 'Include related resources',
                            'schema' => ['type' => 'string'],
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => "{$type} retrieved successfully",
                            'content' => [
                                'application/vnd.api+json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'data' => ['$ref' => "#/components/schemas/{$resourceSchemaName}"],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        '404' => ['$ref' => '#/components/responses/NotFoundError'],
                        '401' => ['$ref' => '#/components/responses/UnauthorizedError'],
                    ],
                ],
                'patch' => [
                    'tags' => [$type],
                    'summary' => "Update a {$type}",
                    'description' => "Update attributes or relationships of an existing {$type}.",
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'string'],
                        ],
                    ],
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['data'],
                                    'properties' => [
                                        'data' => [
                                            'type' => 'object',
                                            'required' => ['id', 'type', 'attributes'],
                                            'properties' => [
                                                'id' => ['type' => 'string'],
                                                'type' => ['type' => 'string', 'example' => $type],
                                                'attributes' => ['type' => 'object'],
                                                'relationships' => ['type' => 'object'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => "{$type} updated successfully",
                            'content' => [
                                'application/vnd.api+json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'data' => ['$ref' => "#/components/schemas/{$resourceSchemaName}"],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        '404' => ['$ref' => '#/components/responses/NotFoundError'],
                        '422' => ['$ref' => '#/components/responses/ValidationError'],
                    ],
                ],
                'delete' => [
                    'tags' => [$type],
                    'summary' => "Delete a {$type}",
                    'description' => "Delete a {$type} resource by ID.",
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'string'],
                        ],
                    ],
                    'responses' => [
                        '204' => ['description' => "{$type} deleted successfully"],
                        '404' => ['$ref' => '#/components/responses/NotFoundError'],
                        '401' => ['$ref' => '#/components/responses/UnauthorizedError'],
                    ],
                ],
            ];
        }

        $spec = [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'CMS JSON:API v1 Specification',
                'description' => 'Complete OpenAPI 3.0 specification for the JSON:API v1 endpoints, dynamically generated from server schema definitions.',
                'version' => '1.0.0',
            ],
            'servers' => [
                [
                    'url' => rtrim($baseUrl, '/') . '/api/v1',
                    'description' => 'JSON:API v1 Production Server',
                ],
            ],
            'security' => [
                ['bearerAuth' => []],
            ],
            'paths' => $paths ?: new \stdClass(),
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'Sanctum / ApiKey',
                        'description' => 'Enter your Bearer Sanctum API Token',
                    ],
                ],
                'responses' => [
                    'UnauthorizedError' => [
                        'description' => 'Authentication token is missing or invalid',
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'errors' => [
                                            'type' => 'array',
                                            'items' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'status' => ['type' => 'string', 'example' => '401'],
                                                    'title' => ['type' => 'string', 'example' => 'Unauthenticated'],
                                                    'detail' => ['type' => 'string', 'example' => 'Invalid API token.'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'ForbiddenError' => [
                        'description' => 'Insufficient permissions or token team mismatch',
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'errors' => [
                                            'type' => 'array',
                                            'items' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'status' => ['type' => 'string', 'example' => '403'],
                                                    'title' => ['type' => 'string', 'example' => 'Forbidden'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'NotFoundError' => [
                        'description' => 'The requested resource was not found',
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'errors' => [
                                            'type' => 'array',
                                            'items' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'status' => ['type' => 'string', 'example' => '404'],
                                                    'title' => ['type' => 'string', 'example' => 'Not Found'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'ValidationError' => [
                        'description' => 'JSON:API validation error',
                        'content' => [
                            'application/vnd.api+json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'errors' => [
                                            'type' => 'array',
                                            'items' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'status' => ['type' => 'string', 'example' => '422'],
                                                    'title' => ['type' => 'string', 'example' => 'Unprocessable Entity'],
                                                    'source' => ['type' => 'object'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'schemas' => $componentsSchemas ?: new \stdClass(),
            ],
        ];

        return response()->json($spec, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    private function mapFieldToOpenApiSchema(Attribute $field): array
    {
        if ($field instanceof Boolean) {
            return ['type' => 'boolean'];
        }

        if ($field instanceof Number) {
            return ['type' => 'number'];
        }

        if ($field instanceof DateTime) {
            return ['type' => 'string', 'format' => 'date-time'];
        }

        if ($field instanceof ArrayHash) {
            return ['type' => 'object'];
        }

        return ['type' => 'string'];
    }
}