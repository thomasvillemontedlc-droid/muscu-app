import { useEffect, useState } from 'react'
import { slugify } from '../lib/slugify.js'
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

// Pas d'incrément par défaut des boutons +/- de charge (voir
// domain/exercises.js#setExerciseWeightStep pour l'override mémorisé par
// exercice) : 1,25kg pour une barre (petits disques), 1kg pour une poulie
// ou des haltères, dont les paliers disponibles sont plus fins.
function getDefaultWeightStep(name) {
  const slug = slugify(name ?? '')
  if (slug.includes('poulie') || slug.includes('haltere')) return 1
  return 1.25
}

function computePerSide(total, barWeight) {
  const perSide = (total - barWeight) / 2
  return perSide > 0 ? Math.round(perSide * 10) / 10 : 0
}

function computeTotal(barWeight, perSide) {
  return Math.round((barWeight + perSide * 2) * 10) / 10
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
  className,
  stepper = false,
  'aria-label': ariaLabel,
}) {
  const mode = exercise?.weightInputMode ?? 'total'
  const isDumbbell = isDumbbellExercise(exercise?.name)
  const hasBar = hasSharedBar(exercise?.name)
  // Pas de barre partagée aux haltères ni aux poulies vis-à-vis : chaque
  // saisie de "poids par côté" représente déjà le poids total de ce côté,
  // rien à additionner.
  const barWeight = hasBar ? (exercise?.barWeight ?? DEFAULT_BAR_WEIGHT) : 0
  const step = exercise?.weightStep ?? getDefaultWeightStep(exercise?.name)
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
      <button type="button" className="weight-field__mode-toggle" onClick={() => onModeChange('total')}>
        Saisir le poids total
      </button>
    </div>
  )
}
