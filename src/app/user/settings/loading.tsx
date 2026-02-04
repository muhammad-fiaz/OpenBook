import { SettingsSkeleton } from "@/components/skeletons";

export default function SettingsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <SettingsSkeleton />
    </div>
  );
}
