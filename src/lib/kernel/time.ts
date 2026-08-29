type StringKey<T> = Extract<keyof T, string>;

export type OffsetFieldMap<TFixture> = Partial<
  Record<StringKey<TFixture>, string>
>;

export type HydratedFixture<
  TFixture,
  TOffsetFields extends OffsetFieldMap<TFixture>,
> = Omit<TFixture, keyof TOffsetFields> & {
  [TField in TOffsetFields[keyof TOffsetFields] & string]: string;
};

export function relativeIso(now: number, offsetMinutes: number) {
  return new Date(now + offsetMinutes * 60_000).toISOString();
}

export function hydrateFixture<
  TFixture extends object,
  const TOffsetFields extends OffsetFieldMap<TFixture>,
>(
  fixture: TFixture,
  now: number,
  offsetFields: TOffsetFields,
): HydratedFixture<TFixture, TOffsetFields> {
  const hydrated = { ...fixture } as Record<string, unknown>;

  for (const [offsetField, isoField] of Object.entries(offsetFields)) {
    if (typeof isoField !== "string") continue;
    const offsetMinutes = hydrated[offsetField];
    if (typeof offsetMinutes !== "number") {
      throw new TypeError(`${offsetField} must contain a minute offset.`);
    }
    hydrated[isoField] = relativeIso(now, offsetMinutes);
    delete hydrated[offsetField];
  }

  return hydrated as HydratedFixture<TFixture, TOffsetFields>;
}
