import { AppShell } from "@/components/AppShell";
import { DraftEditor } from "@/components/DraftEditor";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <DraftEditor id={id} />
    </AppShell>
  );
}
