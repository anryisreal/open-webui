<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';

	import { listWorkspaces } from '$lib/apis/gpthub/workspaces';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import FolderOpen from '$lib/components/icons/FolderOpen.svelte';
	import { projects, projectsLoaded, user } from '$lib/stores';

	const i18n = getContext('i18n');

	export let workspaceId = '';

	let loading = false;
	let attemptedLoad = false;

	const loadProjects = async (force = false) => {
		if (!$user?.id || ($projectsLoaded && !force)) {
			return;
		}

		attemptedLoad = true;
		loading = true;
		try {
			const items = await listWorkspaces($user.id);
			projects.set(items);
			projectsLoaded.set(true);
		} catch (error) {
			console.error('Failed to load projects', error);
		} finally {
			loading = false;
		}
	};

	onMount(async () => {
		await loadProjects();
	});

	$: selectedProject = $projects.find((project) => project.id === workspaceId) ?? null;
	$: if ($projectsLoaded && workspaceId && !selectedProject) {
		workspaceId = '';
	}
	$: if ($user?.id && !$projectsLoaded && !loading && !attemptedLoad) {
		void loadProjects();
	}
</script>

<div class="flex items-center gap-2 max-w-full">
	<div class="relative min-w-0">
		<div
			class="gpthub-project-selector flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-gray-100 px-3 py-2 min-w-[11rem] max-w-[15rem]"
		>
			<div class="shrink-0 text-gray-300">
				<FolderOpen className="size-4" />
			</div>

			<div class="min-w-0 flex-1">
				<div class="text-[10px] uppercase tracking-[0.16em] text-gray-400">
					{$i18n.t('Проект')}
				</div>
				<div class="text-sm font-medium truncate text-gray-100">
					{selectedProject ? selectedProject.name : $i18n.t('Без проекта')}
				</div>
			</div>

			<div class="shrink-0 text-gray-400">
				{#if loading}
					<Spinner className="size-4" />
				{:else}
					<ChevronDown className="size-4" />
				{/if}
			</div>
		</div>

		<select
			class="absolute inset-0 opacity-0 cursor-pointer"
			bind:value={workspaceId}
			aria-label={$i18n.t('Выберите проект')}
		>
			<option value="">{String($i18n.t('Без проекта'))}</option>
			{#each $projects as project (project.id)}
				<option value={project.id}>{project.name}</option>
			{/each}
		</select>
	</div>

	<button
		type="button"
		class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition hover:border-[#e30613]/40 hover:bg-[#e30613]/15 hover:text-white"
		on:click={() => {
			goto(selectedProject ? `/projects/${selectedProject.id}` : '/projects');
		}}
	>
		{selectedProject ? $i18n.t('Открыть') : $i18n.t('Проекты')}
	</button>
</div>
