import { supabase } from "./supabase";

/**
 * Verifies the user is authenticated before write operations.
 */
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Você precisa estar logado para realizar esta ação.");
  }
  return session;
}

/**
 * Creates a new folder.
 */
export async function createFolder(name: string, parentId: string | null) {
  await requireAuth();

  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id: parentId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Slugifies a string for URL-friendly slugs.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Creates a new flow from a Bizagi JSON export.
 * Optionally uploads an SVG file to Supabase Storage.
 */
export async function createFlow(
  folderId: string,
  title: string,
  bizagiJson: Record<string, unknown>,
  svgFile?: File
) {
  const slug = slugify(title);
  let svgUrl: string | null = null;

  // Upload SVG if provided
  if (svgFile) {
    const fileName = `${slug}-${Date.now()}.svg`;
    const { error: uploadError } = await supabase.storage
      .from("flow-assets")
      .upload(fileName, svgFile, { contentType: "image/svg+xml" });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("flow-assets")
      .getPublicUrl(fileName);

    svgUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("flows")
    .insert({
      folder_id: folderId,
      title,
      slug,
      svg_url: svgUrl,
      bizagi_data: bizagiJson,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a folder and all its children (cascading).
 */
export async function deleteFolder(id: string) {
  await requireAuth();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Deletes a flow.
 */
export async function deleteFlow(id: string) {
  await requireAuth();
  const { error } = await supabase.from("flows").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Renames a folder.
 */
export async function renameFolder(id: string, newName: string) {
  await requireAuth();
  const { error } = await supabase
    .from("folders")
    .update({ name: newName })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Renames a flow.
 */
export async function renameFlow(id: string, newTitle: string) {
  await requireAuth();
  const { error } = await supabase
    .from("flows")
    .update({ title: newTitle })
    .eq("id", id);
  if (error) throw error;
}
