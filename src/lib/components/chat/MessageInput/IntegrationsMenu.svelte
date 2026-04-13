<script lang="ts">
	import { getContext, tick } from 'svelte';

	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Search from '$lib/components/icons/Search.svelte';

	const i18n = getContext('i18n');

	export let selectedToolIds: string[] = [];
	export let selectedModels: string[] = [];
	export let fileUploadCapableModels: string[] = [];
	export let toggleFilters: { id: string; name: string; description?: string; icon?: string }[] = [];
	export let selectedFilterIds: string[] = [];
	export let showDeepResearchButton = false;
	export let deepResearchEnabled = false;
	export let showImageGenerationButton = false;
	export let imageGenerationEnabled = false;
	export let showCodeInterpreterButton = false;
	export let codeInterpreterEnabled = false;
	export let onShowValves: Function;
	export let onClose: Function;
	export let closeOnOutsideClick = true;

	let show = false;
</script>

<Dropdown
	bind:show
	onOpenChange={(state) => {
		if (state === false) {
			onClose();
		}
	}}
>
	<Tooltip content={$i18n.t('Integrations')} placement="top">
		<slot />
	</Tooltip>

	<div slot="content">
		<div
			class="min-w-70 max-w-70 rounded-2xl px-1 py-1 border border-gray-100 dark:border-gray-800 z-50 bg-white dark:bg-gray-850 dark:text-white shadow-lg max-h-72 overflow-y-auto overflow-x-hidden scrollbar-thin"
		>
			{#if showDeepResearchButton}
				<Tooltip
					content="Многошаговое исследование с источниками"
					placement="top-start"
				>
					<button
						class="flex w-full justify-between gap-2 items-center px-3 py-1.5 text-sm cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
						aria-pressed={deepResearchEnabled}
						aria-label={deepResearchEnabled
							? $i18n.t('Disable Deep Research')
							: $i18n.t('Enable Deep Research')}
						on:click={async () => {
							deepResearchEnabled = !deepResearchEnabled;
							await tick();
						}}
					>
						<div class="flex-1 truncate">
							<div class="flex flex-1 gap-2 items-center">
								<div class="shrink-0">
									<Search className="size-4" strokeWidth="1.75" />
								</div>

								<div class="truncate">Deep Research</div>
							</div>
						</div>

						<div class="shrink-0">
							<Switch state={deepResearchEnabled} />
						</div>
					</button>
				</Tooltip>
			{:else}
				<div class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
					{$i18n.t('No additional integrations available')}
				</div>
			{/if}
		</div>
	</div>
</Dropdown>
