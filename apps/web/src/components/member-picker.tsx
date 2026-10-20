import type { Member } from "@repo/db/shared";
import { type ChangeEvent, useCallback } from "react";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";

interface MemberPickerProps {
  members: readonly Member[];
  onChange: (memberId: string) => void;
  value: string | undefined;
}

/** Chooses who the page acts as. There is no sign-in yet. */
export default function MemberPicker({
  members,
  onChange,
  value,
}: MemberPickerProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
    [onChange]
  );

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-muted-foreground" htmlFor="acting-member">
        Acting as
      </label>
      <NativeSelect id="acting-member" onChange={handleChange} value={value}>
        {members.map((member) => (
          <NativeSelectOption key={member.id} value={member.id}>
            {member.name} ({member.role})
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
