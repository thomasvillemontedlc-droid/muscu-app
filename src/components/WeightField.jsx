import { useEffect, useState } from 'react'
import { slugify } from '../lib/slugify.js'
import { getEffectiveWeightStep } from '../domain/exercises.js'
import { NumberField } from './NumberField.jsx'
import { StepperField } from './StepperField.jsx'

const DEFAULT_BAR_WEIGHT = 20

// Un exercice aux haltères n'a pas de barre partagée : chaque main porte son
// propre poids, le total est juste le double du poids par haltère. Détecté
// par le nom (nos exercices "... haltères" vs "... barre") plutôt qu'un
// champ dédié à saisir manuellement.
function isDumbbellExercise(name) {
  return slugify(name ?? '').includes('haltere')
}

// Le champ "Barre (kg)" du mode par côté n'a de sens que pour les exercices
// qui utilisent réellement une barre partagée (charge = poids de la barre +
// disques des deux côtés). Les haltères et les poulies vis-à-vis (écarté,
// oiseau...) chargent chaque côté indépendamment : "par côté" y est déjà le
// poids total de ce côté, sans barre à additionner.
function hasSharedBar(name) {
  return slugify(name ?? '').includes('barre')
}

// Exercice à la poulie réglable en HAUTEUR : seulement les vis-à-vis
// (écarté/oiseau vis-à-vis, et tout équivalent), où la hauteur de poulie
// varie réellement d'une fois sur l'autre. Les exercices "poulie haute"/
// "poulie basse" (tirages, extensions triceps, curl...) ont une position
// fixe déjà encodée dans leur nom : pas ce champ pour eux, voir
// isGripWidthExercise ci-dessous pour les tirages (qui varient par largeur
// de prise, pas par hauteur).
function isPulleyExercise(name) {
  const slug = slugify(name ?? '')
  return slug.includes('poulie') && slug.includes('vis-a-vis')
}

// Tirage horizontal/vertical et variantes : varient par largeur de prise
// (large/moyenne/serrée), pas par hauteur de poulie - voir isPulleyExercise
// ci-dessus pour la distinction.
function isGripWidthExercise(name) {
  return slugify(name ?? '').includes('tirage')
}

const PULLEY_LEVEL_PRESETS = ['Haute', 'Moyenne', 'Basse']
const GRIP_WIDTH_PRESETS = ['Large', 'Moyenne', 'Serrée']

// Choix rapide + valeur libre mémorisés par exercice (exercise.pulleyLevel /
// exercise.gripWidth, voir domain/exercises.js), même principe que
// FeelingPicker : 3 boutons + un champ texte, les deux écrivent la même
// valeur.
function PresetField({ label, presets, value, placeholder, ariaLabel, className, onChange }) {
  return (
    <div className={className}>
      <span>{label}</span>
      <div className="weight-field__preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`weight-field__preset-button${value === preset ? ' weight-field__preset-button--selected' : ''}`}
            onClick={() => onChange(value === preset ? null : preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="weight-field__preset-input"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={ariaLabel}
      />
    </div>
  )
}

function computePerSide(total, barWeight) {
  const perSide = (total - barWeight) / 2
  return perSide > 0 ? Math.round(perSide * 100) / 100 : 0
}

function computeTotal(barWeight, perSide) {
  return Math.round((barWeight + perSide * 2) * 100) / 100
}

// Poids total (mode par défaut) ou décomposé (mode symétrique : barre,
// haltères, poulies vis-à-vis) — la donnée stockée reste toujours le poids
// TOTAL (comparée dans l'historique), la décomposition n'est qu'une aide de
// saisie. Mode et poids de barre mémorisés par exercice
// (exercise.weightInputMode / exercise.barWeight, voir domain/exercises.js).
// stepper=true (écran de séance guidée) affiche des boutons +/- au lieu
// d'un clavier nu, et permet d'ajuster le pas d'incrément.
export function WeightField({
  exercise,
  value,
  onChange,
  onModeChange,
  onBarWeightChange,
  onStepChange,
  onPulleyLevelChange,
  onGripWidthChange,
  className,
  stepper = false,
  'aria-label': ariaLabel,
}) {
  const mode = exercise?.weightInputMode ?? 'total'
  const isDumbbell = isDumbbellExercise(exercise?.name)
  const hasBar = hasSharedBar(exercise?.name)
  const pulleyControl = isPulleyExercise(exercise?.name) && onPulleyLevelChange && (
    <PresetField
      className="weight-field__pulley"
      label="Niveau de poulie"
      presets={PULLEY_LEVEL_PRESETS}
      value={exercise?.pulleyLevel ?? null}
      placeholder="Cran précis (optionnel)"
      ariaLabel="Niveau de poulie précis"
      onChange={onPulleyLevelChange}
    />
  )
  const gripControl = isGripWidthExercise(exercise?.name) && onGripWidthChange && (
    <PresetField
      className="weight-field__grip"
      label="Prise"
      presets={GRIP_WIDTH_PRESETS}
      value={exercise?.gripWidth ?? null}
      placeholder="Précision (optionnel)"
      ariaLabel="Largeur de prise précise"
      onChange={onGripWidthChange}
    />
  )
  // Pas de barre partagée aux haltères ni aux poulies vis-à-vis : chaque
  // saisie de "poids par côté" représente déjà le poids total de ce côté,
  // rien à additionner.
  const barWeight = hasBar ? (exercise?.barWeight ?? DEFAULT_BAR_WEIGHT) : 0
  const step = getEffectiveWeightStep(exercise)
  const [perSide, setPerSide] = useState(() => computePerSide(value, barWeight))
  const [editingStep, setEditingStep] = useState(false)

  useEffect(() => {
    setPerSide(computePerSide(value, barWeight))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode])

  const ValueField = stepper ? StepperField : NumberField
  const valueFieldProps = stepper ? { step, min: 0, decimal: true } : { decimal: true }

  const stepControl = stepper && (
    <div className="weight-field__step">
      {editingStep ? (
        // Le blur est posé sur le wrapper (pas directement sur NumberField)
        // car NumberField applique déjà son propre onBlur en interne (voir
        // components/NumberField.jsx) : un onBlur passé en prop l'écraserait
        // au lieu de s'y ajouter.
        <label className="weight-field__step-edit" onBlur={() => setEditingStep(false)}>
          <span>Pas (kg)</span>
          <NumberField decimal value={step} onChange={onStepChange} autoFocus aria-label="Pas d'incrément du poids en kg" />
        </label>
      ) : (
        <button type="button" className="weight-field__step-toggle" onClick={() => setEditingStep(true)}>
          Pas : {step}kg
        </button>
      )}
    </div>
  )

  if (mode !== 'perSide') {
    return (
      <div className="weight-field">
        <ValueField className={className} value={value} onChange={onChange} aria-label={ariaLabel} {...valueFieldProps} />
        {stepControl}
        {pulleyControl}
        {gripControl}
        <button type="button" className="weight-field__mode-toggle" onClick={() => onModeChange('perSide')}>
          Saisir par côté
        </button>
      </div>
    )
  }

  function handleBarWeightChange(newBarWeight) {
    onBarWeightChange(newBarWeight)
    onChange(computeTotal(newBarWeight, perSide))
  }

  function handlePerSideChange(newPerSide) {
    setPerSide(newPerSide)
    onChange(computeTotal(barWeight, newPerSide))
  }

  return (
    <div className="weight-field weight-field--per-side">
      <div className="weight-field__row">
        {hasBar && (
          <label>
            <span>Barre (kg)</span>
            <NumberField decimal value={barWeight} onChange={handleBarWeightChange} aria-label="Poids de la barre en kg" />
          </label>
        )}
        <label>
          <span>{isDumbbell ? 'Poids par haltère (kg)' : 'Par côté (kg)'}</span>
          <ValueField
            value={perSide}
            onChange={handlePerSideChange}
            aria-label="Poids par côté en kg"
            {...valueFieldProps}
          />
        </label>
      </div>
      <p className="weight-field__total">Total : {computeTotal(barWeight, perSide)}kg</p>
      {stepControl}
      {pulleyControl}
      {gripControl}
      <button type="button" className="weight-field__mode-toggle" onClick={() => onModeChange('total')}>
        Saisir le poids total
      </button>
    </div>
  )
}
