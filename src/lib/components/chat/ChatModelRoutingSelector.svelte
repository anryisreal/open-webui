<script lang="ts">
	import { getContext } from 'svelte';

	import { models, type Model } from '$lib/stores';
	import { hasGptHubModality, type GptHubModality } from '$lib/utils/gpthubModels';

	import Selector from './ModelSelector/Selector.svelte';

	const i18n = getContext('i18n');

	type ChatModelSelectionMode = 'auto' | 'custom';
	type ChatRoutingModels = {
		text: string;
		image: string;
		audio: string;
	};

	type SelectorItem = {
		value: string;
		label: string;
		model: Model;
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

	const sameRoutingModels = (left: ChatRoutingModels, right: ChatRoutingModels) =>
		left.text === right.text && left.image === right.image && left.audio === right.audio;

	const isRussianLocale = () => {
		const language = $i18n?.resolvedLanguage ?? $i18n?.language ?? '';
		return typeof language === 'string' && language.toLowerCase().startsWith('ru');
	};

	const textLabel = () => (isRussianLocale() ? '\u0422\u0435\u043a\u0441\u0442' : 'Text');
	const imageLabel = () =>
		(isRussianLocale() ? '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435' : 'Image');
	const audioLabel = () => (isRussianLocale() ? '\u0410\u0443\u0434\u0438\u043e' : 'Audio');
	const autoModeLabel = () => (isRussianLocale() ? '\u0410\u0432\u0442\u043e' : 'Auto');
	const customModeLabel = () =>
		(isRussianLocale()
			? '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0439'
			: 'Custom');

	const visibleModels = () => ($models ?? []).filter((model) => !(model?.info?.meta?.hidden ?? false));

	const toItems = (sourceModels: Model[]): SelectorItem[] =>
		sourceModels.map((model) => ({
			value: model.id,
			label: model.name,
			model
		}));

	const firstMatchingValue = (items: SelectorItem[], candidates: string[]) => {
		const availableValues = new Set(items.map((item) => item.value));
		return candidates.find((candidate) => candidate && availableValues.has(candidate)) ?? '';
	};

	const firstValue = (items: SelectorItem[]) => items[0]?.value ?? '';

	const routingSourceModels = (modality: GptHubModality) => {
		const availableModels = visibleModels().filter((model) => model.id !== AUTO_MODEL_ID);
		const filteredModels = availableModels.filter((model) => hasGptHubModality(model, modality));
		return filteredModels.length > 0 ? filteredModels : availableModels;
	};

	let textItems: SelectorItem[] = [];
	let imageItems: SelectorItem[] = [];
	let audioItems: SelectorItem[] = [];

	$: {
		textItems = toItems(routingSourceModels('text'));
		imageItems = toItems(routingSourceModels('vision'));
		audioItems = toItems(routingSourceModels('audio'));
	}

	const normalizeRoutingModels = (current: ChatRoutingModels): ChatRoutingModels => {
		const text =
			firstMatchingValue(textItems, [current.text, selectedModels[0], firstValue(textItems)]) || '';
		const image =
			firstMatchingValue(imageItems, [current.image, firstValue(imageItems), text]) || text || '';
		const audio =
			firstMatchingValue(audioItems, [current.audio, firstValue(audioItems), text]) || text || '';
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
			{autoModeLabel()}
		</button>
		<button
			type="button"
			class="px-3 py-1.5 rounded-full text-sm transition border {modelSelectionMode === 'custom'
				? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
				: 'bg-transparent text-gray-600 border-gray-200 hover:border-gray-300 dark:text-gray-300 dark:border-gray-800 dark:hover:border-gray-700'}"
			on:click={() => setMode('custom')}
			{disabled}
		>
			{customModeLabel()}
		</button>
	</div>

	{#if modelSelectionMode === 'custom'}
		<div class="flex items-center gap-2 max-w-full overflow-x-auto pb-0.5">
			<div class="flex items-center gap-1.5 min-w-0">
				<div class="text-[11px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
					{textLabel()}
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
					{imageLabel()}
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
					{audioLabel()}
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
