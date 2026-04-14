<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { models, settings } from '$lib/stores';
	import { updateUserSettings } from '$lib/apis/users';

	import Selector from './ModelSelector/Selector.svelte';

	const i18n = getContext('i18n');

	type ChatModelSelectionMode = 'auto' | 'custom';
	type ChatRoutingModels = {
		text: string;
		image: string;
		audio: string;
	};

	const AUTO_MODEL_ID = 'auto';

	export let selectedModels = [''];
	export let modelSelectionMode: ChatModelSelectionMode = 'auto';
	export let routingModels: ChatRoutingModels = {
		text: '',
		image: '',
		audio: ''
	};
	export let disabled = false;
	export let showSetDefault = true;

	const sameRoutingModels = (left: ChatRoutingModels, right: ChatRoutingModels) =>
		left.text === right.text && left.image === right.image && left.audio === right.audio;

	const uniqueValues = (values: string[]) => Array.from(new Set(values.filter((value) => value)));

	const configuredVisionModelIds = () =>
		uniqueValues([
			...(import.meta.env.VITE_GPTHUB_VISION_MODELS ?? '')
				.split(',')
				.map((modelId) => modelId.trim()),
			...($models ?? [])
				.map((model) => model?.id ?? '')
				.filter((modelId) => /(^|[-_.])vl([-_.]|$)/i.test(modelId))
		]);

	const configuredAudioModelIds = () =>
		uniqueValues(
			(import.meta.env.VITE_GPTHUB_AUDIO_MODELS ?? '')
				.split(',')
				.map((modelId) => modelId.trim())
		);

	const visibleModels = () => ($models ?? []).filter((model) => !(model?.info?.meta?.hidden ?? false));

	const toItems = (sourceModels) =>
		sourceModels.map((model) => ({
			value: model.id,
			label: model.name,
			model
		}));

	const firstMatchingValue = (items, candidates: string[]) => {
		const availableValues = new Set(items.map((item) => item.value));
		return candidates.find((candidate) => candidate && availableValues.has(candidate)) ?? '';
	};

	const firstValue = (items) => items[0]?.value ?? '';

	let textItems = [];
	let imageItems = [];
	let audioItems = [];

	$: {
		const availableModels = visibleModels().filter((model) => model.id !== AUTO_MODEL_ID);
		textItems = toItems(availableModels);

		const visionIds = new Set(configuredVisionModelIds());
		const filteredImageModels = availableModels.filter((model) =>
			visionIds.size > 0
				? visionIds.has(model.id)
				: (model?.info?.meta?.capabilities?.vision ?? false)
		);
		imageItems = toItems(filteredImageModels.length > 0 ? filteredImageModels : availableModels);

		const audioIds = new Set(configuredAudioModelIds());
		const filteredAudioModels = availableModels.filter((model) =>
			audioIds.size > 0 ? audioIds.has(model.id) : false
		);
		audioItems = toItems(filteredAudioModels.length > 0 ? filteredAudioModels : availableModels);
	}

	const normalizeRoutingModels = (current: ChatRoutingModels): ChatRoutingModels => {
		const text =
			firstMatchingValue(textItems, [current.text, selectedModels[0], firstValue(textItems)]) || '';
		const image =
			firstMatchingValue(imageItems, [current.image, text, firstValue(imageItems)]) || text || '';
		const audio =
			firstMatchingValue(audioItems, [current.audio, text, firstValue(audioItems)]) || text || '';
		return { text, image, audio };
	};

	$: if ($models.length > 0) {
		const normalized = normalizeRoutingModels(routingModels);
		if (!sameRoutingModels(routingModels, normalized)) {
			routingModels = normalized;
		}
	}

	$: if (modelSelectionMode === 'auto') {
		if (JSON.stringify(selectedModels) !== JSON.stringify([AUTO_MODEL_ID])) {
			selectedModels = [AUTO_MODEL_ID];
		}
	} else {
		const nextSelectedModels = [routingModels.text || ''];
		if (JSON.stringify(selectedModels) !== JSON.stringify(nextSelectedModels)) {
			selectedModels = nextSelectedModels;
		}
	}

	const setMode = (mode: ChatModelSelectionMode) => {
		modelSelectionMode = mode;
		if (mode === 'custom') {
			routingModels = normalizeRoutingModels(routingModels);
		}
	};

	const saveDefaultModel = async () => {
		if (modelSelectionMode === 'custom' && !routingModels.text) {
			toast.error($i18n.t('Choose a model before saving...'));
			return;
		}

		const nextSettings = {
			...$settings,
			models: selectedModels,
			gpthubModelMode: modelSelectionMode,
			gpthubRoutingModels: routingModels
		};
		settings.set(nextSettings);
		await updateUserSettings(localStorage.token, { ui: nextSettings });

		toast.success($i18n.t('Default model updated'));
	};
</script>

<div class="flex flex-col w-full items-start gap-1.5">
	<div class="flex items-center gap-1.5">
		<button
			type="button"
			class="px-3 py-1.5 rounded-full text-sm transition border {modelSelectionMode === 'auto'
				? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
				: 'bg-transparent text-gray-600 border-gray-200 hover:border-gray-300 dark:text-gray-300 dark:border-gray-800 dark:hover:border-gray-700'}"
			on:click={() => setMode('auto')}
			{disabled}
		>
			Auto
		</button>
		<button
			type="button"
			class="px-3 py-1.5 rounded-full text-sm transition border {modelSelectionMode === 'custom'
				? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
				: 'bg-transparent text-gray-600 border-gray-200 hover:border-gray-300 dark:text-gray-300 dark:border-gray-800 dark:hover:border-gray-700'}"
			on:click={() => setMode('custom')}
			{disabled}
		>
			Custom
		</button>
	</div>

	{#if modelSelectionMode === 'auto'}
		<div
			class="px-4 py-2 rounded-2xl border border-gray-200 bg-white/70 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-200"
		>
			Text, image, and audio routing is selected automatically
		</div>
	{:else}
		<div class="flex items-center gap-2 max-w-full overflow-x-auto pb-0.5">
			<div class="flex items-center gap-1.5 min-w-0">
				<div class="text-[11px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
					Text
				</div>
				<div class="min-w-[14rem] max-w-[16rem]">
					<Selector
						id="routing-text"
						placeholder={$i18n.t('Select a model')}
						items={textItems}
						bind:value={routingModels.text}
						triggerClassName="text-base"
					/>
				</div>
			</div>

			<div class="flex items-center gap-1.5 min-w-0">
				<div class="text-[11px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
					Image
				</div>
				<div class="min-w-[14rem] max-w-[16rem]">
					<Selector
						id="routing-image"
						placeholder={$i18n.t('Select a model')}
						items={imageItems}
						bind:value={routingModels.image}
						triggerClassName="text-base"
					/>
				</div>
			</div>

			<div class="flex items-center gap-1.5 min-w-0">
				<div class="text-[11px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
					Audio
				</div>
				<div class="min-w-[14rem] max-w-[16rem]">
					<Selector
						id="routing-audio"
						placeholder={$i18n.t('Select a model')}
						items={audioItems}
						bind:value={routingModels.audio}
						triggerClassName="text-base"
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showSetDefault}
	<div
		class="relative text-left mt-[1px] ml-1 text-[0.7rem] text-gray-600 dark:text-gray-400 font-primary"
	>
		<button on:click={saveDefaultModel}> {$i18n.t('Set as default')}</button>
	</div>
{/if}
