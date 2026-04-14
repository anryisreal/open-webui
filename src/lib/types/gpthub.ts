export type WorkspaceProject = {
	id: string;
	name: string;
	instructions: string;
	model: string;
	created_at: string;
	updated_at: string;
};

export type ChatProjectAssignment = {
	id: string;
	title: string;
	workspace_id: string;
	updated_at: number;
	created_at: number;
};
