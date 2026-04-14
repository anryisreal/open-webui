import type { WorkspaceProject } from '$lib/types/gpthub';

const GPTHUB_API_BASE_URL = '/v1';

type WorkspacePayload = {
	name: string;
	instructions?: string;
	model?: string;
};

const extractError = async (res: Response) => {
	try {
		const body = await res.json();
		return body?.detail ?? body?.error ?? 'Не удалось выполнить запрос';
	} catch {
		return 'Не удалось выполнить запрос';
	}
};

const request = async <T>(
	path: string,
	userId: string,
	init: RequestInit = {}
): Promise<T> => {
	const res = await fetch(`${GPTHUB_API_BASE_URL}${path}`, {
		...init,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'x-user-id': userId,
			...(init.headers ?? {})
		}
	});

	if (!res.ok) {
		throw new Error(await extractError(res));
	}

	if (res.status === 204) {
		return undefined as T;
	}

	return res.json();
};

export const listWorkspaces = async (userId: string): Promise<WorkspaceProject[]> => {
	const res = await request<{ workspaces: WorkspaceProject[] }>('/workspaces', userId, {
		method: 'GET'
	});
	return res.workspaces ?? [];
};

export const getWorkspace = async (userId: string, workspaceId: string): Promise<WorkspaceProject> =>
	request<WorkspaceProject>(`/workspaces/${workspaceId}`, userId, {
		method: 'GET'
	});

export const createWorkspace = async (
	userId: string,
	payload: WorkspacePayload
): Promise<WorkspaceProject> =>
	request<WorkspaceProject>('/workspaces', userId, {
		method: 'POST',
		body: JSON.stringify(payload)
	});

export const updateWorkspace = async (
	userId: string,
	workspaceId: string,
	payload: Partial<WorkspacePayload>
): Promise<WorkspaceProject> =>
	request<WorkspaceProject>(`/workspaces/${workspaceId}`, userId, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});

export const deleteWorkspace = async (userId: string, workspaceId: string): Promise<void> => {
	await request<void>(`/workspaces/${workspaceId}`, userId, {
		method: 'DELETE'
	});
};
