<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, getContext } from 'svelte';

	import { user } from '$lib/stores';
	import { updateUserProfile, getSessionUser } from '$lib/apis/auths';
	import { generateInitialsImage } from '$lib/utils';

	import UpdatePassword from './Account/UpdatePassword.svelte';

	const i18n = getContext('i18n');

	export let saveHandler: Function;

	let name = '';
	let profileImageUrl = '';

	const submitHandler = async () => {
		if (name !== $user?.name) {
			if (profileImageUrl === generateInitialsImage($user?.name) || profileImageUrl === '') {
				profileImageUrl = generateInitialsImage(name);
			}
		}

		const updatedUser = await updateUserProfile(localStorage.token, {
			name,
			profile_image_url: profileImageUrl
		}).catch((error) => {
			toast.error(`${error}`);
		});

		if (updatedUser) {
			const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
				toast.error(`${error}`);
				return null;
			});

			if (sessionUser) {
				await user.set(sessionUser);
			}

			return true;
		}

		return false;
	};

	onMount(async () => {
		const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		if (sessionUser) {
			name = sessionUser?.name ?? '';
			profileImageUrl =
				sessionUser?.profile_image_url ?? generateInitialsImage(sessionUser?.name ?? '');
		}
	});
</script>

<div id="tab-account" class="flex flex-col h-full justify-between text-sm">
	<div class="overflow-y-scroll max-h-[28rem] md:max-h-full">
		<div>
			<div class="text-base font-medium">{$i18n.t('Your Account')}</div>
			<div class="text-xs text-gray-500 mt-0.5">
				{$i18n.t('Manage your account information.')}
			</div>
		</div>

		<div class="mt-4">
			<div class="mb-1 text-xs font-medium">{$i18n.t('Name')}</div>
			<input
				class="w-full text-sm dark:text-gray-300 bg-transparent outline-hidden"
				type="text"
				bind:value={name}
				aria-label={$i18n.t('Name')}
				required
				placeholder={$i18n.t('Enter your name')}
			/>
		</div>

		<hr class="border-gray-50 dark:border-gray-850/30 my-4" />

		<div class="mt-2">
			<UpdatePassword />
		</div>
	</div>

	<div class="flex justify-end pt-3 text-sm font-medium">
		<button
			class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
			on:click={async () => {
				const res = await submitHandler();

				if (res) {
					saveHandler();
				}
			}}
		>
			{$i18n.t('Save')}
		</button>
	</div>
</div>
