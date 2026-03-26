import { supabase } from "./supabase";
import type { Folder, Flow, FolderTreeNode } from "./types";

/**
 * Fetches all folders and flows, then builds a nested tree structure.
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
  const [foldersRes, flowsRes] = await Promise.all([
    supabase.from("folders").select("*").order("name"),
    supabase.from("flows").select("id, folder_id, title, slug, svg_url, created_at").order("title"),
  ]);

  if (foldersRes.error) throw foldersRes.error;
  if (flowsRes.error) throw flowsRes.error;

  const folders: Folder[] = foldersRes.data;
  const flows: Flow[] = flowsRes.data as Flow[];

  // Build lookup maps
  const nodeMap = new Map<string, FolderTreeNode>();
  for (const folder of folders) {
    nodeMap.set(folder.id, { folder, children: [], flows: [] });
  }

  // Assign flows to their folders
  for (const flow of flows) {
    const node = nodeMap.get(flow.folder_id);
    if (node) node.flows.push(flow);
  }

  // Build tree
  const roots: FolderTreeNode[] = [];
  for (const folder of folders) {
    const node = nodeMap.get(folder.id)!;
    if (folder.parent_id && nodeMap.has(folder.parent_id)) {
      nodeMap.get(folder.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Fetches a single flow by its ID or slug, including its full bizagi_data.
 */
export async function getFlowByIdOrSlug(identifier: string): Promise<Flow | null> {
  // Check if identifier is a UUID (very basic check)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  const query = supabase.from("flows").select("*");
  
  if (isUuid) {
    query.eq("id", identifier);
  } else {
    query.eq("slug", identifier);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching flow:", error);
    return null;
  }

  return data as Flow;
}

/**
 * Fetches all flows (lightweight, without bizagi_data) for listing.
 */
export async function getAllFlows(): Promise<Flow[]> {
  const { data, error } = await supabase
    .from("flows")
    .select("id, folder_id, title, slug, svg_url, created_at")
    .order("title");

  if (error) {
    console.error("Error fetching flows:", error);
    return [];
  }

  return data as Flow[];
}

/**
 * Gets the breadcrumb path for a folder (from root to target).
 */
export async function getFolderBreadcrumb(folderId: string): Promise<Folder[]> {
  const { data: folders, error } = await supabase
    .from("folders")
    .select("*");

  if (error || !folders) return [];

  const folderMap = new Map<string, Folder>();
  for (const f of folders) {
    folderMap.set(f.id, f as Folder);
  }

  const path: Folder[] = [];
  let current = folderMap.get(folderId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? folderMap.get(current.parent_id) : undefined;
  }

  return path;
}
