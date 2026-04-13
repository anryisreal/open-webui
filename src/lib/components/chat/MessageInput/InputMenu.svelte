<script lang="ts">
	import { getContext } from 'svelte';

	import { user } from '$lib/stores';

	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Camera from '$lib/components/icons/Camera.svelte';
	import Clip from '$lib/components/icons/Clip.svelte';

	const i18n = getContext('i18n');

	export let files = [];

	export let selectedModels: string[] = [];
	export let fileUploadCapableModels: string[] = [];

	export let screenCaptureHandler: Function;
	export let uploadFilesHandler: Function;
	export let inputFilesHandler: Function;

	export let uploadGoogleDriveHandler: Function;
	export let uploadOneDriveHandler: Function;

	export let onUpload: Function;
	export let onClose: Function;

	let show = false;

	let fileUploadEnabled = true;
	$: fileUploadEnabled =
		fileUploadCapableModels.length === selectedModels.length &&
		($user?.role === 'admin' || $user?.permissions?.chat?.file_upload);

	$: if (!fileUploadEnabled && files.length > 0) {
		files = [];
	}

	const detectMobile = () => {
		const userAgent = navigator.userAgent || navigator.vendor || window.opera;
		return /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
	};

	const handleFileChange = (event) => {
		const inputFiles = Array.from(event.target?.files);
		if (inputFiles && inputFiles.length > 0) {
			inputFilesHandler(inputFiles);
		}
	};
</script>

<input
	id="camera-input"
	type="file"
	accept="image/*"
	capture="environment"
	on:change={handleFileChange}
	style="display: none;"
/>

<Dropdown
	bind:show
	on:change={(e) => {
		if (e.detail === false) {
			onClose();
		}
	}}
>
	<Tooltip content={$i18n.t('More')}>
		<slot />
	</Tooltip>

	<div slot="content">
		<div
			class="w-70 rounded-2xl px-1 py-1 border border-gray-100 dark:border-gray-800 z-50 bg-white dark:bg-gray-850 dark:text-white shadow-lg max-h-72 overflow-y-auto overflow-x-hidden scrollbar-thin transition"
		>
			<Tooltip
				content={fileUploadCapableModels.length !== selectedModels.length
					? $i18n.t('Model(s) do not support file upload')
					: !fileUploadEnabled
						? $i18n.t('You do not have permission to upload files.')
						: ''}
				className="w-full"
			>
				<button
					class="flex w-full gap-2 items-center px-3 py-1.5 text-sm select-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl {!fileUploadEnabled
						? 'opacity-50'
						: ''}"
					type="button"
					on:click={() => {
						if (fileUploadEnabled) {
							uploadFilesHandler();
						}
					}}
				>
					<Clip />

					<div class="line-clamp-1">{$i18n.t('Upload Files')}</div>
				</button>
			</Tooltip>

			<Tooltip
				content={fileUploadCapableModels.length !== selectedModels.length
					? $i18n.t('Model(s) do not support file upload')
					: !fileUploadEnabled
						? $i18n.t('You do not have permission to upload files.')
						: ''}
				className="w-full"
			>
				<button
					class="flex w-full gap-2 items-center px-3 py-1.5 text-sm select-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl {!fileUploadEnabled
						? 'opacity-50'
						: ''}"
					type="button"
					on:click={() => {
						if (fileUploadEnabled) {
							if (!detectMobile()) {
								screenCaptureHandler();
							} else {
								const cameraInputElement = document.getElementById('camera-input');

								if (cameraInputElement) {
									cameraInputElement.click();
								}
							}
						}
					}}
				>
					<Camera />
					<div class=" line-clamp-1">{$i18n.t('Capture')}</div>
				</button>
			</Tooltip>
		</div>
	</div>
</Dropdown>
