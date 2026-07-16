import { redirect } from "next/navigation";
import {
  getDashboardHomeForProfile,
  requireDashboardUser,
} from "@/lib/auth/route-access";

export default async function DashboardStartPage() {
  const { profile } = await requireDashboardUser();

  redirect(getDashboardHomeForProfile(profile));
}


