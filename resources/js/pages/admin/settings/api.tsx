import { SettingsSection } from '@/components/settings/settings-section';
import { EnvironmentSwitch, SandboxNotice } from '@/components/settings/environment-switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, router, usePage } from '@inertiajs/react';
import {
  storeApiKey, regenerateApiKey, destroyApiKey,
} from '@/actions/App/Http/Controllers/Admin/SettingController';
import { toast } from 'sonner';
import {
  AlertTriangle, Check, Copy, ExternalLink, KeyRound, MoreVertical, RotateCw, Search, Trash2, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ApiSettings } from '@/types/settings';
import { useApiEnvironment } from '@/hooks/use-api-environment';

const RESOURCES = ['posts', 'pages', 'products', 'media'] as const;
const ACTIONS = ['read', 'write'] as const;

const METHOD_STYLES: Record<string, string> = {
  GET: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  POST: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PUT: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PATCH: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  DELETE: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

type ApiKeyRow = ApiSettings['keys'][number];
let lastRevealedKey: string | null = null;

export default function ApiTab({ data }: { data: ApiSettings }) {
  const page = usePage();
  const { currentTeam } = page.props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const [env] = useApiEnvironment();
  const [open, setOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyRow | null>(null);
  const [endpointQuery, setEndpointQuery] = useState('');

  const form = useForm({ name: '', abilities: [] as string[], expires_at: '' });

  useEffect(() => {
    const key = data.plain_text_key;
    if (key && key !== lastRevealedKey) {
      lastRevealedKey = key;
      setRevealedKey(key);
    }
  }, [data.plain_text_key]);

  // In Test, keys are read-only unless the backend opted in (settings.test_keys_can_write).
  const writeRestricted = env === 'test' && !data.summary.test_keys_can_write;

  // Switching to Test drops any write ability that was already ticked.
  useEffect(() => {
    if (!writeRestricted) return;
    const cleaned = form.data.abilities.filter((a) => a.endsWith(':read'));
    if (cleaned.length !== form.data.abilities.length) form.setData('abilities', cleaned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeRestricted]);

  const keys = useMemo(() => data.keys.filter((k) => (k.environment ?? 'live') === env), [data.keys, env]);
  const counts = useMemo(
    () => ({
      live: data.keys.filter((k) => (k.environment ?? 'live') === 'live').length,
      test: data.keys.filter((k) => k.environment === 'test').length,
    }),
    [data.keys],
  );

  function createKey(e: React.FormEvent) {
    e.preventDefault();
    form.transform((d) => ({ ...d, environment: env }));
    form.post(storeApiKey(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast.success('API key created.');
      },
    });
  }

  function revokeKey() {
    if (!keyToRevoke) return;
    router.delete(destroyApiKey({ current_team: teamSlug, apiKey: keyToRevoke.id }).url, {
      preserveScroll: true,
      onSuccess: () => setKeyToRevoke(null),
    });
  }

  const endpoints = useMemo(() => {
    const q = endpointQuery.trim().toLowerCase();
    if (!q) return data.endpoints;
    return data.endpoints.filter(
      (ep) =>
        ep.uri.toLowerCase().includes(q) ||
        (ep.name ?? '').toLowerCase().includes(q) ||
        ep.methods.some((m) => m.toLowerCase().includes(q)),
    );
  }, [data.endpoints, endpointQuery]);

  const envLabel = env === 'test' ? 'test' : 'production';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">API access</h2>
          <p className="text-sm text-muted-foreground">
            Keys and webhooks are separate for test and production.
          </p>
        </div>
        <EnvironmentSwitch value={env} counts={counts} />
      </div>

      <SettingsSection
        title="REST API"
        description="Connection details for apps that call your API."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href={data.summary.openapi_url} target="_blank" rel="noreferrer">
              OpenAPI schema
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Base URL" value={data.summary.base_url} copyable />
          <InfoTile label="Version" value={data.summary.version} />
          <InfoTile label="Rate limit" value={data.summary.rate_limit} />
          <InfoTile label="Authentication" value="Bearer token" />
        </dl>
      </SettingsSection>

      <SettingsSection
        title="GraphQL"
        description="Query exactly the data you need from a single endpoint."
        actions={
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5',
              data.summary.graphql.enabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                data.summary.graphql.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/50',
              )}
            />
            {data.summary.graphql.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <InfoTile label="Endpoint" value={data.summary.graphql.endpoint} copyable />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={data.summary.graphql.endpoint}>Schema</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={data.summary.graphql.playground} target="_blank" rel="noreferrer">
                Open playground
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={env === 'test' ? 'Test API keys' : 'Production API keys'}
        description={
          env === 'test'
            ? 'For staging and preview sites. Prefixed cms_test_.'
            : 'For live sites and apps. Treat them like passwords. Prefixed cms_live_.'
        }
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                New {envLabel} key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create {envLabel} API key</DialogTitle>
                <DialogDescription>
                  Give it only the permissions the app needs. You can revoke it at any time.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={createKey} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder={env === 'test' ? 'Staging site' : 'Marketing site'}
                    autoFocus
                  />
                  {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                </div>

                <AbilitiesPicker
                  value={form.data.abilities}
                  onChange={(next) => form.setData('abilities', next)}
                  readOnlyOnly={writeRestricted}
                />
                {form.errors.abilities && <p className="text-xs text-destructive">{form.errors.abilities}</p>}

                <div className="space-y-2">
                  <Label htmlFor="key-expires">Expires on</Label>
                  <Input
                    id="key-expires"
                    type="date"
                    value={form.data.expires_at}
                    onChange={(e) => form.setData('expires_at', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for a key that never expires.</p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.processing || !form.data.name || form.data.abilities.length === 0}
                  >
                    Create key
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {env === 'test' && <SandboxNotice canWrite={data.summary.test_keys_can_write} />}

        <RevealedKeyDialog value={revealedKey} onClose={() => setRevealedKey(null)} />

        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No {envLabel} keys yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create a {envLabel} key to start calling the API from your {env === 'test' ? 'staging' : 'live'} apps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[140px]">Name</TableHead>
                  <TableHead className="min-w-[160px]">Key</TableHead>
                  <TableHead className="min-w-[200px]">Abilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(key.key_prefix)}
                        title="Copy prefix"
                        className="group inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {key.key_prefix}…
                        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </button>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.abilities.map((a) => (
                          <Badge key={a} variant="secondary" className="font-mono text-[11px] font-normal">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <KeyStatus expiresAt={key.expires_at} />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {key.last_used_at ?? 'Never'}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${key.name}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.post(
                                regenerateApiKey({ current_team: teamSlug, apiKey: key.id }).url,
                                {},
                                { preserveScroll: true },
                              )
                            }
                          >
                            <RotateCw className="mr-2 h-3.5 w-3.5" />
                            Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setKeyToRevoke(key)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SettingsSection>

      <Dialog open={!!keyToRevoke} onOpenChange={(v) => !v && setKeyToRevoke(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke “{keyToRevoke?.name}”?</DialogTitle>
            <DialogDescription>
              Any app using this key will stop working immediately. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToRevoke(null)}>Cancel</Button>
            <Button variant="destructive" onClick={revokeKey}>Revoke key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsSection
        title="Endpoints"
        description="Detected automatically from your routes, so it’s always up to date."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={endpointQuery}
              onChange={(e) => setEndpointQuery(e.target.value)}
              placeholder="Search endpoints"
              className="h-8 pl-8"
              aria-label="Search endpoints"
            />
          </div>
        }
      >
        <div className="max-h-[480px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="hover:bg-muted">
                <TableHead className="w-28">Method</TableHead>
                <TableHead>URI</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No endpoints match “{endpointQuery}”.
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((ep) => (
                  <TableRow key={ep.uri + ep.methods.join()}>
                    <TableCell>
                      <div className="flex gap-1">
                        {ep.methods.map((m) => (
                          <Badge
                            key={m}
                            variant="outline"
                            className={cn('font-mono text-[11px] font-semibold', METHOD_STYLES[m])}
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{ep.uri}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {ep.name ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {endpoints.length} of {data.endpoints.length} endpoints.
        </p>
      </SettingsSection>
    </div>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard.');
}

function InfoTile({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/30 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-sm" title={value}>{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => copyToClipboard(value)}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

function RevealedKeyDialog({ value, onClose }: { value: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  }

  function close() {
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={!!value} onOpenChange={(v) => !v && close()}>
      {/* Clic fuera deshabilitado para no perder la key por accidente */}
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription>
            Copy it now and store it somewhere safe. For security, we can’t show it again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md border bg-muted px-3 py-2 font-mono text-sm">
            {value}
          </code>
          <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={close}>{copied ? 'Done' : 'I’ve copied it'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyStatus({ expiresAt }: { expiresAt?: string | null }) {
  const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-normal',
        expired
          ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', expired ? 'bg-red-500' : 'bg-emerald-500')} />
      {expired ? 'Expired' : 'Active'}
    </Badge>
  );
}

/** Resource × action matrix. With `readOnlyOnly` (Test keys) full access and write are locked. */
function AbilitiesPicker({
  value,
  onChange,
  readOnlyOnly,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  readOnlyOnly: boolean;
}) {
  const full = value.includes('*');

  function toggle(ability: string, checked: boolean) {
    onChange(checked ? [...value, ability] : value.filter((a) => a !== ability));
  }

  return (
    <div className="space-y-2">
      <Label>Abilities</Label>

      <label
        className={cn(
          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
          readOnlyOnly ? 'pointer-events-none opacity-50' : 'cursor-pointer',
          full && 'border-primary/50 bg-primary/5',
        )}
      >
        <Checkbox
          className="mt-0.5"
          checked={full}
          disabled={readOnlyOnly}
          onCheckedChange={(c) => onChange(c ? ['*'] : [])}
        />
        <span>
          <span className="block text-sm font-medium">Full access</span>
          <span className="block text-xs text-muted-foreground">
            {readOnlyOnly ? 'Not available for test keys.' : 'Read and write everything. Use with care.'}
          </span>
        </span>
      </label>

      <div className={cn('overflow-hidden rounded-lg border', full && 'pointer-events-none opacity-50')}>
        <div className="grid grid-cols-[1fr_72px_72px] bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>Resource</span>
          <span className="text-center">Read</span>
          <span className="text-center">Write</span>
        </div>
        {RESOURCES.map((resource) => (
          <div key={resource} className="grid grid-cols-[1fr_72px_72px] items-center border-t px-3 py-2.5">
            <span className="text-sm capitalize">{resource}</span>
            {ACTIONS.map((action) => {
              const ability = `${resource}:${action}`;
              const locked = full || (readOnlyOnly && action === 'write');
              return (
                <span key={ability} className={cn('flex justify-center', locked && action === 'write' && readOnlyOnly && 'opacity-40')}>
                  <Checkbox
                    aria-label={ability}
                    disabled={locked}
                    checked={value.includes(ability)}
                    onCheckedChange={(c) => toggle(ability, !!c)}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
