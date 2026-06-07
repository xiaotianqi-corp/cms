<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('field_groups', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique('fg_slug_unq');
            $table->text('description')->nullable();
            $table->string('content_type');
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('field_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_group_id');
            $table->foreign('field_group_id', 'fd_field_group_fk')->references('id')->on('field_groups')->cascadeOnDelete();
            $table->string('label');
            $table->string('name');
            $table->string('type');
            $table->json('options')->nullable();
            $table->json('settings')->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('required')->default(false);
            $table->string('default_value')->nullable();
            $table->integer('order')->default(0);
            $table->foreignId('parent_id')->nullable();
            $table->foreign('parent_id', 'fd_parent_fk')->references('id')->on('field_definitions')->cascadeOnDelete();
            $table->timestamps();
            $table->index(['field_group_id', 'order'], 'fd_group_order_idx');
        });

        Schema::create('content_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_group_id');
            $table->foreign('field_group_id', 'cs_field_group_fk')->references('id')->on('field_groups')->cascadeOnDelete();
            $table->unsignedBigInteger('sectionable_id');
            $table->string('sectionable_type');
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->index(['sectionable_type', 'sectionable_id'], 'cs_sectionable_idx');
            $table->index(['field_group_id', 'order'], 'cs_group_order_idx');
        });

        Schema::create('content_section_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_section_id');
            $table->foreign('content_section_id', 'csv_content_section_fk')->references('id')->on('content_sections')->cascadeOnDelete();
            $table->foreignId('field_definition_id');
            $table->foreign('field_definition_id', 'csv_field_definition_fk')->references('id')->on('field_definitions')->cascadeOnDelete();
            $table->unsignedInteger('row_index')->default(0);
            $table->longText('value')->nullable();
            $table->timestamps();
            $table->index(['content_section_id', 'field_definition_id', 'row_index'], 'csv_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_section_values');
        Schema::dropIfExists('content_sections');
        Schema::dropIfExists('field_definitions');
        Schema::dropIfExists('field_groups');
    }
};
