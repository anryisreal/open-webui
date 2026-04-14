<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';

	import Modal from '$lib/components/common/Modal.svelte';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;
	export let title = '';
	export let submitLabel = '';
	export let initialName = '';
	export let initialInstructions = '';
	export let submitting = false;

	let name = '';
	let instructions = '';
	let lastOpenState = false;

	$: if (show && !lastOpenState) {
		name = initialName;
		instructions = initialInstructions;
	}

	$: lastOpenState = show;

	const submit = () => {
		dispatch('submit', {
			name: name.trim(),
			instructions: instructions.trim()
		});
	};
</script>

<Modal bind:show size="md">
	<div class="flex flex-col gap-6 p-6 sm:p-8">
		<div class="flex flex-col gap-2">
			<div class="text-2xl font-semibold text-gray-950 dark:text-gray-50">
				{title || $i18n.t('Новый проект')}
			</div>
			<div class="text-sm text-gray-500 dark:text-gray-400">
				{$i18n.t('Инструкции проекта будут добавляться в чаты, подключенные к этому проекту.')}
			</div>
		</div>

		<div class="flex flex-col gap-4">
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-gray-700 dark:text-gray-200">
					{$i18n.t('Название')}
				</span>
				<input
					bind:value={name}
					type="text"
					placeholder={$i18n.t('Например, Аналитика продукта')}
					class="rounded-3xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-50"
				/>
			</label>

			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-gray-700 dark:text-gray-200">
					{$i18n.t('Инструкции')}
				</span>
				<textarea
					bind:value={instructions}
					rows="8"
					placeholder={$i18n.t('Опишите, как ассистент должен работать внутри этого проекта.')}
					class="rounded-[1.75rem] border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-50"
				/>
			</label>
		</div>

		<div class="flex items-center justify-end gap-3">
			<button
				type="button"
				class="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
				on:click={() => {
					show = false;
				}}
			>
				{$i18n.t('Отмена')}
			</button>

			<button
				type="button"
				class="rounded-full bg-[#e30613] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c70511] disabled:cursor-not-allowed disabled:opacity-60"
				disabled={submitting || !name.trim()}
				on:click={submit}
			>
				{submitting ? $i18n.t('Сохранение...') : submitLabel || $i18n.t('Создать проект')}
			</button>
		</div>
	</div>
</Modal>
