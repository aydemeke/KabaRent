import { useEffect, useState } from 'react'
import { getAll, create, update, softDelete } from '../../api/kabas'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'

const COLOR_OPTIONS = [
  { label: 'Black Gold', colors: ['#1a1a1a', '#C5A028'] },
  { label: 'Black White', colors: ['#1a1a1a', '#f0f0f0'] },
  { label: 'Blue Gold',  colors: ['#1a3a8f', '#C5A028'] },
  { label: 'Red Gold',   colors: ['#B71C1C', '#C5A028'] },
  { label: 'Red White',  colors: ['#B71C1C', '#f0f0f0'] },
  { label: 'White Gold', colors: ['#f0f0f0', '#C5A028'] },
]

const CATEGORY_OPTIONS = ['Wedding', 'Anniversary', 'Other']
const SIZE_OPTIONS = ['Small', 'Medium', 'Large']

const KABA_IMAGES = [
  { file: 'black-gold.jpg',  label: 'Black Gold' },
  { file: 'black-white.jpg', label: 'Black White' },
  { file: 'classic.jpg',     label: 'Classic' },
  { file: 'red.jpg',         label: 'Red' },
]

function ColorSwatch({ colors, size = 16 }) {
  return (
    <span
      className="inline-block rounded-sm flex-shrink-0"
      style={{
        width: size, height: size,
        background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
        border: '1px solid rgba(0,0,0,0.10)',
      }}
    />
  )
}

function FieldLabel({ children }) {
  return <label className="ds-label block mb-1.5">{children}</label>
}

function ColorSelectField({ value, onChange }) {
  return (
    <div>
      <FieldLabel>Color *</FieldLabel>
      <div className="relative">
        <select value={value} onChange={onChange} required className="ds-select pl-10">
          <option value="">— select color —</option>
          {COLOR_OPTIONS.map(o => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {value
            ? <ColorSwatch colors={COLOR_OPTIONS.find(o => o.label === value)?.colors ?? ['#ccc','#ccc']} />
            : <span className="inline-block w-4 h-4 rounded-sm bg-surface-container" />
          }
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {COLOR_OPTIONS.map(o => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange({ target: { value: o.label } })}
            title={o.label}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-inter text-xs font-medium transition-all ${
              value === o.label
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <ColorSwatch colors={o.colors} size={12} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ImagePickerField({ value, onChange }) {
  return (
    <div>
      <FieldLabel>Image</FieldLabel>
      <div className="grid grid-cols-4 gap-2">
        {KABA_IMAGES.map(img => {
          const path = `/kaba-pictures/${img.file}`
          const selected = value === path
          return (
            <button
              key={img.file}
              type="button"
              onClick={() => onChange(selected ? '' : path)}
              className={`rounded-xl overflow-hidden transition-all focus:outline-none ${
                selected ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ border: selected ? '2px solid #012d1d' : '2px solid transparent' }}
            >
              <img src={path} alt={img.label} className="w-full h-16 object-cover" />
              <p className="text-[10px] text-center py-0.5 font-inter text-on-surface-variant bg-surface-container-low">{img.label}</p>
            </button>
          )
        })}
      </div>
      {value && <p className="mt-1.5 text-xs font-inter text-on-surface-variant truncate">Selected: {value}</p>}
    </div>
  )
}

const empty = { name: '', description: '', category: '', size: '', pricePerDay: '', quantity: 1, imageUrl: '' }

export default function AdminKabasPage() {
  const [kabas, setKabas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return getAll({ active: undefined }).then(setKabas).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm(empty); setEditId(null); setError(''); setModal('create') }
  function openEdit(kaba) {
    setForm({ name: kaba.name, description: kaba.description || '', category: kaba.category || '',
      size: kaba.size || '', pricePerDay: kaba.pricePerDay, quantity: kaba.quantity, imageUrl: kaba.imageUrl || '' })
    setEditId(kaba.id); setError(''); setModal('edit')
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      modal === 'create' ? await create(form) : await update(editId, form)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.')
    } finally { setSaving(false) }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this Kaba?')) return
    await softDelete(id); load()
  }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-jakarta font-bold text-on-surface" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
          Kaba Inventory
        </h1>
        <button onClick={openCreate} className="ds-btn-primary">+ Add Kaba</button>
      </div>

      <div className="ds-panel">
        <table className="w-full text-sm">
          <thead><tr className="ds-table-head">
            <th>Color</th><th>Category</th><th>Size</th>
            <th>Price/day</th><th>Qty</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody className="divide-y" style={{ borderColor: 'rgba(193,200,194,0.20)' }}>
            {kabas.map(k => {
              const swatch = COLOR_OPTIONS.find(o => o.label === k.name)
              return (
                <tr key={k.id} className={`hover:bg-surface-container-low transition-colors ${!k.active ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {swatch && <ColorSwatch colors={swatch.colors} size={13} />}
                      <span className="font-inter font-medium text-on-surface">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{k.category || '—'}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{k.size || '—'}</td>
                  <td className="px-4 py-3 font-inter font-semibold text-primary">₪{k.pricePerDay}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{k.quantity}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-inter font-semibold"
                      style={k.active
                        ? { background: 'rgba(1,45,29,0.10)', color: '#012d1d' }
                        : { background: 'rgba(65,72,68,0.08)', color: '#414844' }
                      }
                    >
                      {k.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button onClick={() => openEdit(k)} className="ds-btn-text text-xs">Edit</button>
                    {k.active && (
                      <button
                        onClick={() => handleDeactivate(k.id)}
                        className="font-inter text-xs font-medium hover:underline"
                        style={{ color: '#560000' }}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Add new Kaba' : 'Edit Kaba'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <ColorSelectField value={form.name} onChange={set('name')} />

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                className="ds-input resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Category</FieldLabel>
                <select value={form.category} onChange={set('category')} className="ds-select">
                  <option value="">— select —</option>
                  {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Size</FieldLabel>
                <select value={form.size} onChange={set('size')} className="ds-select">
                  <option value="">— select —</option>
                  {SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Price per day (₪) *</FieldLabel>
                <input type="number" value={form.pricePerDay} onChange={set('pricePerDay')}
                  required min="0.01" step="0.01" className="ds-input" />
              </div>
              <div>
                <FieldLabel>Quantity *</FieldLabel>
                <input type="number" value={form.quantity} onChange={set('quantity')}
                  required min="1" className="ds-input" />
              </div>
            </div>

            <ImagePickerField value={form.imageUrl} onChange={path => setForm(f => ({ ...f, imageUrl: path }))} />

            {error && <p className="font-inter text-sm" style={{ color: '#560000' }}>{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="ds-btn-text">Cancel</button>
              <button type="submit" disabled={saving} className="ds-btn-primary">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
