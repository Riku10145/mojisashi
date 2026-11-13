// stopped-by: TS2304
export async function keep(text: string): Promise<void> {
  const dir = await navigator.storage.getDirectory();
  const file = await dir.getFileHandle("text.txt", { create: true });
  const writable = await file.createWritable();
  await writable.write(text);
  await writable.close();
}
