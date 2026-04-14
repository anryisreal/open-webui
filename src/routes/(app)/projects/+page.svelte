<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { getChatProjectAssignments } from '$lib/apis/chats';
	import { createWorkspace, listWorkspaces } from '$lib/apis/gpthub/workspaces';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';
	import Search from '$lib/components/icons/Search.svelte';
	import ProjectFormModal from '$lib/components/projects/ProjectFormModal.svelte';
	import { projects, projectsLoaded, user } from '$lib/stores';

	const i18n = getContext('i18n');

	let loading = true;
	let creating = false;
	let showCreateModal = false;
	let search = '';
	let chatCounts: Record<string, number> = {};

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));

	const loadData = async () => {
		if (!$user?.id) {
			return;
		}

		loading = true;
		try {
			const [workspaceItems, assignments] = await Promise.all([
				listWorkspaces($user.id),
				getChatProjectAssignments(localStorage.token)
			]);

			projects.set(workspaceItems);
			projectsLoaded.set(true);
			chatCounts = assignments.reduce(
				(acc, assignment) => {
					acc[assignment.workspace_id] = (acc[assignment.workspace_id] ?? 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
		} finally {
			loading = false;
		}
	};

	const handleCreate = async (event) => {
		if (!$user?.id) {
			return;
		}

		creating = true;
		try {
			const project = await createWorkspace($user.id, {
				name: event.detail.name,
				instructions: event.detail.instructions
			});
			projects.update((items) => [project, ...items]);
			projectsLoaded.set(true);
			showCreateModal = false;
			toast.success($i18n.t('Проект создан'));
			goto(`/projects/${project.id}`);
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
		} finally {
			creating = false;
		}
	};

	onMount(async () => {
		await loadData();
	});

	$: filteredProjects = ($projects ?? []).filter((project) => {
		const normalizedQuery = search.trim().toLowerCase();
		if (!normalizedQuery) {
			return true;
		}

		return [project.name, project.instructions].some((value) =>
			value?.toLowerCase().includes(normalizedQuery)
		);
	});
</script>

<ProjectFormModal
	bind:show={showCreateModal}
	title={$i18n.t('Новый проект')}
	submitLabel={$i18n.t('Создать проект')}
	submitting={creating}
	on:submit={handleCreate}
/>

<svelte:head>
	<title>{$i18n.t('Проекты')}</title>
</svelte:head>

<div class="min-h-screen bg-[#181615] text-gray-100">
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
		<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div class="flex flex-col gap-2">
				<div class="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0caa5]/70">
					{$i18n.t('Проекты')}
				</div>
				<h1 class="font-primary text-4xl font-semibold text-[#fff7ef]">
					{$i18n.t('Проекты')}
				</h1>
				<p class="max-w-2xl text-sm text-gray-400">
					{$i18n.t(
						'Создавайте отдельные проектные контексты, храните инструкции и подключайте нужные чаты к нужному проекту.'
					)}
				</p>
			</div>

			<button
				type="button"
				class="inline-flex items-center gap-2 self-start rounded-full bg-[#f6f0e7] px-4 py-3 text-sm font-semibold text-[#1c1715] transition hover:bg-white"
				on:click={() => {
					showCreateModal = true;
				}}
			>
				<Plus className="size-4" />
				<span>{$i18n.t('Новый проект')}</span>
			</button>
		</div>

		<div class="rounded-[2rem] border border-white/6 bg-white/[0.04] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">
					<Search className="size-4" />
				</div>
				<input
					bind:value={search}
					type="text"
					placeholder={$i18n.t('Поиск проектов...')}
					class="w-full rounded-[1.5rem] border border-white/8 bg-[#23201d] py-3 pl-11 pr-4 text-sm text-gray-100 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15"
				/>
			</div>
		</div>

		{#if loading}
			<div class="flex min-h-[16rem] items-center justify-center rounded-[2rem] border border-white/6 bg-white/[0.04]">
				<Spinner className="size-8" />
			</div>
		{:else if filteredProjects.length === 0}
			<div class="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
				<div class="mx-auto flex max-w-xl flex-col gap-3">
					<div class="text-2xl font-semibold text-[#fff7ef]">
						{search.trim() ? $i18n.t('Ничего не найдено') : $i18n.t('Пока нет проектов')}
					</div>
					<div class="text-sm text-gray-400">
						{search.trim()
							? $i18n.t('Попробуйте другой запрос или создайте новый проект.')
							: $i18n.t('Создайте первый проект, чтобы хранить инструкции и связанные чаты вместе.')}
					</div>
				</div>
			</div>
		{:else}
			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredProjects as project (project.id)}
					<button
						type="button"
						class="group flex min-h-[15rem] flex-col rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(227,6,19,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#e30613]/30 hover:shadow-[0_28px_70px_rgba(227,6,19,0.16)]"
						on:click={() => {
							goto(`/projects/${project.id}`);
						}}
					>
						<div class="flex items-start justify-between gap-4">
							<div class="text-xl font-semibold text-[#fff7ef]">{project.name}</div>
							<div class="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-gray-300">
								{chatCounts[project.id] ?? 0} {$i18n.t('чатов')}
							</div>
						</div>

						<div class="mt-5 line-clamp-4 text-sm leading-6 text-gray-300/85">
							{project.instructions || $i18n.t('Пока нет инструкций для этого проекта.')}
						</div>

						<div class="mt-auto flex items-center justify-between pt-8 text-xs text-gray-400">
							<div>{$i18n.t('Обновлен')} {formatDate(project.updated_at)}</div>
							<div class="text-[#f0caa5] transition group-hover:text-white">
								{$i18n.t('Открыть')}
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
