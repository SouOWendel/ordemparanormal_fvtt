const { StringField, NumberField, SchemaField, BooleanField } = foundry.data.fields;

export const DegreeField = () =>
	new SchemaField({
		label: new StringField({ initial: "untrained" }),
		value: new NumberField({ initial: 0, integer: true }),
	});

export const SkillConditionsField = (defaults = {}) =>
	new SchemaField({
		load: new BooleanField({ initial: defaults.load ?? false }),
		trained: new BooleanField({ initial: defaults.trained ?? false }),
		open: new BooleanField({ initial: defaults.open ?? false }), // For freeSkill
	});

export const AttributeField = () =>
	new SchemaField({
		value: new NumberField({ initial: 1, min: 0, integer: true }),
		bonus: new NumberField({ initial: 0, integer: true }),
	});
