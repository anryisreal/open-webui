<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { getChatProjectAssignments, updateChatById } from '$lib/apis/chats';
	import { getWorkspace, listWorkspaces, updateWorkspace } from '$lib/apis/gpthub/workspaces';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ArrowLeft from '$lib/components/icons/ArrowLeft.svelte';
	import { projects, projectsLoaded, user } from '$lib/stores';
	import type { ChatProjectAssignment, WorkspaceProject } from '$lib/types/gpthub';
	import { getTimeRange } from '$lib/utils';

	const i18n = getContext('i18n');

	let loading = true;
	let saving = false;
	let project: WorkspaceProject | null = null;
	let projectChats: ChatProjectAssignment[] = [];
	let moveTargets: Record<string, string> = {};
	let formName = '';
	let formInstructions = '';

	const projectId = () => $page.params.id;

	const syncProjectStore = (workspaceItems: WorkspaceProject[], activeProject?: WorkspaceProject | null) => {
		projects.set(workspaceItems);
		projectsLoaded.set(true);
		if (activeProject) {
			formName = activeProject.name;
			formInstructions = activeProject.instructions;
		}
	};

	const loadData = async () => {
		if (!$user?.id) {
			return;
		}

		loading = true;
		try {
			const [workspaceItem, workspaceItems, assignments] = await Promise.all([
				getWorkspace($user.id, projectId()),
				listWorkspaces($user.id),
				getChatProjectAssignments(localStorage.token, projectId())
			]);

			project = workspaceItem;
			projectChats = assignments;
			moveTargets = assignments.reduce(
				(acc, assignment) => {
					acc[assignment.id] = assignment.workspace_id;
					return acc;
				},
				{} as Record<string, string>
			);
			syncProjectStore(workspaceItems, workspaceItem);
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
			goto('/projects');
		} finally {
			loading = false;
		}
	};

	const saveProject = async () => {
		if (!$user?.id || !project) {
			return;
		}

		saving = true;
		try {
			const updated = await updateWorkspace($user.id, project.id, {
				name: formName,
				instructions: formInstructions
			});

			project = updated;
			projects.update((items) =>
				items.map((item) => (item.id === updated.id ? updated : item))
			);
			toast.success($i18n.t('Проект обновлен'));
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
		} finally {
			saving = false;
		}
	};

	const refreshChats = async () => {
		const assignments = await getChatProjectAssignments(localStorage.token, projectId());
		projectChats = assignments;
		moveTargets = assignments.reduce(
			(acc, assignment) => {
				acc[assignment.id] = assignment.workspace_id;
				return acc;
			},
			{} as Record<string, string>
		);
	};

	const detachChat = async (chatId: string) => {
		try {
			await updateChatById(localStorage.token, chatId, {
				workspaceId: null
			});
			await refreshChats();
			toast.success($i18n.t('Чат отключен от проекта'));
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
		}
	};

	const moveChat = async (chatId: string) => {
		const targetId = moveTargets[chatId] ?? '';
		if (!targetId) {
			await detachChat(chatId);
			return;
		}

		if (targetId === projectId()) {
			return;
		}

		try {
			await updateChatById(localStorage.token, chatId, {
				workspaceId: targetId
			});
			await refreshChats();
			toast.success($i18n.t('Чат перенесен в другой проект'));
		} catch (error) {
			console.error(error);
			toast.error(`${error}`);
		}
	};

	onMount(async () => {
		await loadData();
	});

	$: otherProjects = ($projects ?? []).filter((item) => item.id !== projectId());
	$: hasChanges =
		!!project &&
		(formName.trim() !== project.name || formInstructions.trim() !== (project.instructions ?? ''));
</script>

<svelte:head>
	<title>{project ? `${project.name} - ${$i18n.t('Проекты')}` : $i18n.t('Проекты')}</title>
</svelte:head>

<div class="min-h-screen bg-[#181615] text-gray-100">
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
		<button
			type="button"
			class="inline-flex items-center gap-2 self-start rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 transition hover:border-white/14 hover:bg-white/[0.07] hover:text-white"
			on:click={() => {
				goto('/projects');
			}}
		>
			<ArrowLeft className="size-4" />
			<span>{$i18n.t('Все проекты')}</span>
		</button>

		{#if loading || !project}
			<div class="flex min-h-[20rem] items-center justify-center rounded-[2rem] border border-white/6 bg-white/[0.04]">
				<Spinner className="size-8" />
			</div>
		{:else}
			<div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)]">
				<div class="flex flex-col gap-6">
					<div class="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(227,6,19,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.24)]">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div class="flex flex-col gap-2">
								<div class="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0caa5]/70">
									{$i18n.t('Проект')}
								</div>
								<h1 class="font-primary text-4xl font-semibold text-[#fff7ef]">
									{project.name}
								</h1>
								<div class="text-sm text-gray-400">
									{projectChats.length} {$i18n.t('подключенных чатов')}
								</div>
							</div>

							<button
								type="button"
								class="rounded-full bg-[#f6f0e7] px-4 py-3 text-sm font-semibold text-[#1c1715] transition hover:bg-white"
								on:click={() => {
									goto(`/?project=${project.id}`);
								}}
							>
								{$i18n.t('Новый чат в проекте')}
							</button>
						</div>
					</div>

					<div class="rounded-[2rem] border border-white/6 bg-white/[0.04] p-6">
						<div class="flex items-center justify-between gap-4">
							<div>
								<div class="text-2xl font-semibold text-[#fff7ef]">
									{$i18n.t('Подключенные чаты')}
								</div>
								<div class="mt-1 text-sm text-gray-400">
									{$i18n.t('Открывайте чат, отключайте его от проекта или переносите в другой проект.')}
								</div>
							</div>
						</div>

						<div class="mt-6 flex flex-col divide-y divide-white/6 rounded-[1.75rem] border border-white/6 bg-[#201d1a]/80">
							{#if projectChats.length === 0}
								<div class="px-6 py-10 text-sm text-gray-400">
									{$i18n.t('Пока к этому проекту не подключено ни одного чата.')}
								</div>
							{:else}
								{#each projectChats as chat (chat.id)}
									<div class="flex flex-col gap-4 px-6 py-5">
										<div class="flex flex-col gap-1">
											<button
												type="button"
												class="self-start text-left text-lg font-medium text-[#fff7ef] transition hover:text-white"
												on:click={() => {
													goto(`/c/${chat.id}`);
												}}
											>
												{chat.title}
											</button>
											<div class="text-xs text-gray-500">
												{$i18n.t('Обновлен')} {getTimeRange(chat.updated_at)}
											</div>
										</div>

										<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
											<select
												class="min-w-0 flex-1 rounded-full border border-white/8 bg-[#26221f] px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15"
												value={moveTargets[chat.id] ?? project.id}
												on:change={(event) => {
													moveTargets = {
														...moveTargets,
														[chat.id]: (event.currentTarget as HTMLSelectElement).value
													};
												}}
											>
												<option value={project.id}>{project.name}</option>
												{#each otherProjects as item (item.id)}
													<option value={item.id}>{item.name}</option>
												{/each}
												<option value="">{String($i18n.t('Без проекта'))}</option>
											</select>

											<div class="flex items-center gap-3">
												<button
													type="button"
													class="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/[0.06]"
													on:click={() => {
														moveChat(chat.id);
													}}
												>
													{$i18n.t('Применить')}
												</button>

												<button
													type="button"
													class="rounded-full border border-[#e30613]/20 px-4 py-2.5 text-sm font-medium text-[#ffb9be] transition hover:border-[#e30613]/40 hover:bg-[#e30613]/12 hover:text-white"
													on:click={() => {
														detachChat(chat.id);
													}}
												>
													{$i18n.t('Отключить')}
												</button>
											</div>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-6">
					<div class="rounded-[2rem] border border-white/6 bg-white/[0.04] p-6">
						<div class="text-2xl font-semibold text-[#fff7ef]">
							{$i18n.t('Инструкции')}
						</div>
						<div class="mt-2 text-sm text-gray-400">
							{$i18n.t('Эти инструкции будут автоматически добавляться в чаты, подключенные к проекту.')}
						</div>

						<div class="mt-6 flex flex-col gap-4">
							<label class="flex flex-col gap-2">
								<span class="text-sm font-medium text-gray-200">{$i18n.t('Название')}</span>
								<input
									bind:value={formName}
									type="text"
									class="rounded-full border border-white/8 bg-[#26221f] px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15"
								/>
							</label>

							<label class="flex flex-col gap-2">
								<span class="text-sm font-medium text-gray-200">
									{$i18n.t('Инструкции проекта')}
								</span>
								<textarea
									bind:value={formInstructions}
									rows="12"
									class="rounded-[1.75rem] border border-white/8 bg-[#26221f] px-4 py-4 text-sm text-gray-100 outline-none transition focus:border-[#e30613]/40 focus:ring-2 focus:ring-[#e30613]/15"
								/>
							</label>
						</div>

						<div class="mt-6 flex items-center justify-between gap-3">
							<div class="text-xs text-gray-500">
								{$i18n.t('Обновлен')} {new Intl.DateTimeFormat('ru-RU', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								}).format(new Date(project.updated_at))}
							</div>

							<button
								type="button"
								class="rounded-full bg-[#e30613] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c70511] disabled:cursor-not-allowed disabled:opacity-60"
								disabled={saving || !formName.trim() || !hasChanges}
								on:click={saveProject}
							>
								{saving ? $i18n.t('Сохранение...') : $i18n.t('Сохранить')}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
