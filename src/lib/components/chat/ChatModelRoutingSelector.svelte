<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { models, settings, type Model } from '$lib/stores';
	import { updateUserSettings } from '$lib/apis/users';

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
	export let showSetDefault = true;

	const sameRoutingModels = (left: ChatRoutingModels, right: ChatRoutingModels) =>
		left.text === right.text && left.image === right.image && left.audio === right.audio;

	const uniqueValues = (values: string[]) => Array.from(new Set(values.filter((value) => value)));

	const isRussianLocale = () => {
		const language = $i18n?.resolvedLanguage ?? $i18n?.language ?? '';
		return typeof language === 'string' && language.toLowerCase().startsWith('ru');
	};

	const textLabel = () => (isRussianLocale() ? 'Текст' : 'Text');
	const imageLabel = () => (isRussianLocale() ? 'Изображение' : 'Image');
	const audioLabel = () => (isRussianLocale() ? 'Аудио' : 'Audio');
	const autoModeLabel = () => (isRussianLocale() ? 'Авто' : 'Auto');
	const customModeLabel = () => (isRussianLocale() ? 'Пользовательский' : 'Custom');

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

	const isVisionModel = (model: Model, visionIds: Set<string>) =>
		visionIds.has(model.id) || Boolean(model?.info?.meta?.capabilities?.vision);

	const isAudioModel = (model: Model, audioIds: Set<string>) =>
		audioIds.has(model.id) ||
		Boolean(model?.info?.meta?.capabilities?.audio) ||
		Boolean(model?.info?.meta?.capabilities?.speech_to_text) ||
		Boolean(model?.info?.meta?.capabilities?.transcription);

	const isImageGenerationModel = (model: Model) =>
		Boolean(model?.info?.meta?.capabilities?.image_generation);

	let textItems: SelectorItem[] = [];
	let imageItems: SelectorItem[] = [];
	let audioItems: SelectorItem[] = [];

	$: {
		const availableModels = visibleModels().filter((model) => model.id !== AUTO_MODEL_ID);
		const visionIds = new Set(configuredVisionModelIds());
		const audioIds = new Set(configuredAudioModelIds());

		const filteredTextModels = availableModels.filter(
			(model) =>
				!isVisionModel(model, visionIds) &&
				!isAudioModel(model, audioIds) &&
				!isImageGenerationModel(model)
		);
		textItems = toItems(filteredTextModels.length > 0 ? filteredTextModels : availableModels);

		const filteredImageModels = availableModels.filter((model) => isVisionModel(model, visionIds));
		imageItems = toItems(filteredImageModels.length > 0 ? filteredImageModels : textItems.map((item) => item.model));

		const filteredAudioModels = availableModels.filter((model) => isAudioModel(model, audioIds));
		audioItems = toItems(filteredAudioModels.length > 0 ? filteredAudioModels : textItems.map((item) => item.model));
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

{#if showSetDefault}
	<div
		class="relative text-left mt-[1px] ml-1 text-[0.7rem] text-gray-600 dark:text-gray-400 font-primary"
	>
		<button on:click={saveDefaultModel}> {$i18n.t('Set as default')}</button>
	</div>
{/if}
