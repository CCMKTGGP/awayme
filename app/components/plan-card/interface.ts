import { IPlan } from "@/app/application/[userId]/billing/interface";

export interface IPlanCardProps {
  plan: IPlan;
  isCurrentPlan: boolean;
  isPlanFree: boolean;
  isLoading: boolean;
  isDisabled: boolean;
  isRecomended: boolean;
  onCancel: (plan: IPlan) => void;
  onUpgrade: (plan: IPlan) => void;
}
