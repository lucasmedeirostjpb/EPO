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
  let slug = slugify(title);
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

  // Attempt insert, handling potential slug duplicate
  const insertFlow = async (currentSlug: string): Promise<any> => {
    const { data, error } = await supabase
      .from("flows")
      .insert({
        folder_id: folderId,
        title,
        slug: currentSlug,
        svg_url: svgUrl,
        bizagi_data: bizagiJson,
      })
      .select()
      .single();

    if (error) {
      // If error is unique constraint violation on slug, try a new one
      if (error.code === "23505" && error.message.includes("slug")) {
        const newSlug = `${currentSlug}-${Math.random().toString(36).substring(2, 5)}`;
        return insertFlow(newSlug);
      }
      throw error;
    }
    return data;
  };

  return insertFlow(slug);
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
/**
 * Moves a folder to a new parent.
 */
export async function moveFolder(id: string, newParentId: string | null) {
  await requireAuth();
  
  // Prevent moving a folder into itself (basic check)
  if (id === newParentId) throw new Error("Não é possível mover uma pasta para dentro dela mesma.");

  const { error } = await supabase
    .from("folders")
    .update({ parent_id: newParentId })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Moves a flow to a new folder.
 */
export async function moveFlow(id: string, newFolderId: string) {
  await requireAuth();
  const { error } = await supabase
    .from("flows")
    .update({ folder_id: newFolderId })
    .eq("id", id);
  if (error) throw error;
}
