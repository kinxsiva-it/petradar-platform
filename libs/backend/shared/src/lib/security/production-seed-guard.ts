export function assertProductionSeedIsDisabled(nodeEnv: string | undefined): void {
  if (nodeEnv === 'production') {
    throw new Error(
      'PetRadar demo seed is disabled in production. No production override is supported.',
    );
  }
}
