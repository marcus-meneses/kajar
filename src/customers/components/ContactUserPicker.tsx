import type { User } from "../../shared";
import { RecordPickerModal } from "./RecordPickerModal";

const contactUserPickerLabel = (item: User): string =>
  [item.name || item.login || "Unnamed user", item.status]
    .filter(Boolean)
    .join(" - ");

export function ContactUserPicker({
  users,
  selectedId,
  loading,
  onSelect,
  onClose,
}: {
  users: User[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string | null, user: User | null) => void;
  onClose: () => void;
}) {
  return (
    <RecordPickerModal
      title="Contact user"
      rows={users.map((user) => ({
        id: user.id,
        primary: contactUserPickerLabel(user),
        secondary: user.email ?? "",
      }))}
      selectedId={selectedId}
      loading={loading}
      nullable
      onSelect={(id) =>
        onSelect(id, users.find((item) => item.id === id) ?? null)
      }
      onClose={onClose}
    />
  );
}
