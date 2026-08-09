export interface WarrantyStatusDetails {
  status: "active" | "expiring" | "expired";
  startDate: Date;
  expiryDate: Date;
  daysRemaining: number;
  totalDays: number;
  percentageElapsed: number;
  isExpiringSoon: boolean;
}

export interface ReturnWindowStatusDetails {
  status: "active" | "expiring" | "expired";
  startDate: Date;
  expiryDate: Date;
  daysRemaining: number;
  totalDays: number;
  percentageElapsed: number;
  isEligible: boolean;
}

/**
 * Calculates dynamic warranty statistics and status
 */
export function calculateWarrantyStatus(
  startDateInput: Date | string,
  durationMonths: number,
  reminderThresholdDays: number = 30,
  currentDate: Date = new Date()
): WarrantyStatusDetails {
  const startDate = new Date(startDateInput);
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

  const now = new Date(currentDate);
  const totalMs = expiryDate.getTime() - startDate.getTime();
  const remainingMs = expiryDate.getTime() - now.getTime();

  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  let status: "active" | "expiring" | "expired" = "active";
  if (daysRemaining <= 0) {
    status = "expired";
  } else if (daysRemaining <= reminderThresholdDays) {
    status = "expiring";
  }

  const elapsedMs = now.getTime() - startDate.getTime();
  const percentageElapsed = Math.min(
    100,
    Math.max(0, Math.round((elapsedMs / totalMs) * 100))
  );

  return {
    status,
    startDate,
    expiryDate,
    daysRemaining: Math.max(0, daysRemaining),
    totalDays,
    percentageElapsed,
    isExpiringSoon: status === "expiring",
  };
}

/**
 * Calculates dynamic return window eligibility
 */
export function calculateReturnWindowStatus(
  startDateInput: Date | string,
  durationDays: number = 14,
  currentDate: Date = new Date()
): ReturnWindowStatusDetails {
  const startDate = new Date(startDateInput);
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const now = new Date(currentDate);
  const totalMs = expiryDate.getTime() - startDate.getTime();
  const remainingMs = expiryDate.getTime() - now.getTime();

  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  let status: "active" | "expiring" | "expired" = "active";
  if (daysRemaining <= 0) {
    status = "expired";
  } else if (daysRemaining <= 3) {
    status = "expiring";
  }

  const elapsedMs = now.getTime() - startDate.getTime();
  const percentageElapsed = Math.min(
    100,
    Math.max(0, Math.round((elapsedMs / totalMs) * 100))
  );

  return {
    status,
    startDate,
    expiryDate,
    daysRemaining: Math.max(0, daysRemaining),
    totalDays,
    percentageElapsed,
    isEligible: daysRemaining > 0,
  };
}
