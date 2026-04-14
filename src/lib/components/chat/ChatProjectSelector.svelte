<script lang="ts">
	import { getContext, onMount } from 'svelte';

	import { listWorkspaces } from '$lib/apis/gpthub/workspaces';
	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Check from '$lib/components/icons/Check.svelte';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import FolderOpen from '$lib/components/icons/FolderOpen.svelte';
	import { projects, projectsLoaded, user } from '$lib/stores';

	const i18n = getContext('i18n');

	export let workspaceId = '';
	export let onSelectProject: (workspaceId: string) => Promise<void> | void = () => {};

	let loading = false;
	let attemptedLoad = false;
	let applying = false;
	let showDropdown = false;

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

	const selectProject = async (nextWorkspaceId: string) => {
		if (applying) {
			return;
		}

		if (nextWorkspaceId === selectValue) {
			showDropdown = false;
			return;
		}

		applying = true;
		try {
			await onSelectProject(nextWorkspaceId);
			showDropdown = false;
		} finally {
			applying = false;
		}
	};

	onMount(async () => {
		await loadProjects();
	});

	$: selectedProject = $projects.find((project) => project.id === workspaceId) ?? null;
	$: selectValue = selectedProject ? workspaceId : '';
	$: if ($user?.id && !$projectsLoaded && !loading && !attemptedLoad) {
		void loadProjects();
	}
</script>

<div class="flex items-center max-w-full">
	<Dropdown bind:show={showDropdown} align="end" contentClass="z-[70]">
		<button
			type="button"
			class="gpthub-project-selector flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-left text-gray-100 transition hover:border-white/15 hover:bg-white/[0.075] min-w-[12.5rem] max-w-[15.5rem]"
			aria-label={$i18n.t('Выберите проект')}
			aria-expanded={showDropdown}
		>
			<div class="shrink-0 text-gray-300">
				<FolderOpen className="size-4" />
			</div>

			<div class="min-w-0 flex-1">
				<div class="text-[10px] uppercase tracking-[0.16em] text-gray-400">
					{$i18n.t('Проект')}
				</div>
				<div class="truncate text-sm font-medium text-gray-100">
					{selectedProject ? selectedProject.name : $i18n.t('Без проекта')}
				</div>
			</div>

			<div class="shrink-0 text-gray-400">
				{#if loading || applying}
					<Spinner className="size-4" />
				{:else}
					<ChevronDown className="size-4" />
				{/if}
			</div>
		</button>

		<div slot="content">
			<div
				class="min-w-[16rem] max-w-[18rem] overflow-hidden rounded-2xl border border-white/10 bg-[#15161b]/96 p-1.5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
			>
				<button
					type="button"
					class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition {selectValue === ''
						? 'bg-white/10 text-white'
						: 'text-gray-200 hover:bg-white/[0.06]'}"
					on:click={() => {
						void selectProject('');
					}}
				>
					<div class="min-w-0">
						<div class="truncate font-medium">{$i18n.t('Без проекта')}</div>
						<div class="mt-0.5 text-xs text-gray-400">{$i18n.t('Обычный чат без привязки')}</div>
					</div>
					{#if selectValue === ''}
						<div class="shrink-0 text-[#e30613]">
							<Check className="size-4" strokeWidth="2" />
						</div>
					{/if}
				</button>

				{#if $projects.length > 0}
					<div class="my-1 h-px bg-white/8"></div>

					<div class="max-h-72 overflow-y-auto pr-0.5">
						{#each $projects as project (project.id)}
							<button
								type="button"
								class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition {project.id ===
								selectValue
									? 'bg-white/10 text-white'
									: 'text-gray-200 hover:bg-white/[0.06]'}"
								on:click={() => {
									void selectProject(project.id);
								}}
							>
								<div class="min-w-0">
									<div class="truncate font-medium">{project.name}</div>
									{#if project.description}
										<div class="mt-0.5 line-clamp-2 text-xs text-gray-400">
											{project.description}
										</div>
									{/if}
								</div>
								{#if project.id === selectValue}
									<div class="shrink-0 text-[#e30613]">
										<Check className="size-4" strokeWidth="2" />
									</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</Dropdown>
</div>
