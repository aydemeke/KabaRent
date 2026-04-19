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
      className="inline-block rounded-sm border border-gray-300 flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
      }}
    />
  )
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      >
        <option value="">— select —</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function ColorSelectField({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">Color *</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required
          className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white appearance-none"
        >
          <option value="">— select color —</option>
          {COLOR_OPTIONS.map(o => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </select>
        {/* Swatch preview inside the select box */}
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
          {value
            ? <ColorSwatch colors={COLOR_OPTIONS.find(o => o.label === value)?.colors ?? ['#ccc', '#ccc']} />
            : <span className="inline-block w-4 h-4 rounded-sm border border-gray-300 bg-gray-100" />
          }
        </span>
      </div>
      {/* Visual legend */}
      <div className="mt-2 flex flex-wrap gap-2">
        {COLOR_OPTIONS.map(o => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange({ target: { value: o.label } })}
            title={o.label}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
              value === o.label
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <ColorSwatch colors={o.colors} size={14} />
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
      <label className="block text-sm text-gray-600 mb-2">Image</label>
      <div className="grid grid-cols-4 gap-2">
        {KABA_IMAGES.map(img => {
          const path = `/kaba-pictures/${img.file}`
          const selected = value === path
          return (
            <button
              key={img.file}
              type="button"
              onClick={() => onChange(selected ? '' : path)}
              className={`rounded-lg overflow-hidden border-2 transition-all focus:outline-none ${
                selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={path}
                alt={img.label}
                className="w-full h-16 object-cover"
              />
              <p className="text-[10px] text-center py-0.5 text-gray-500 bg-white">{img.label}</p>
            </button>
          )
        })}
      </div>
      {value && (
        <p className="mt-1 text-xs text-gray-400 truncate">Selected: {value}</p>
      )}
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
    return getAll({ active: undefined })
      .then(setKabas)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(empty)
    setEditId(null)
    setError('')
    setModal('create')
  }

  function openEdit(kaba) {
    setForm({
      name: kaba.name,
      description: kaba.description || '',
      category: kaba.category || '',
      size: kaba.size || '',
      pricePerDay: kaba.pricePerDay,
      quantity: kaba.quantity,
      imageUrl: kaba.imageUrl || '',
    })
    setEditId(kaba.id)
    setError('')
    setModal('edit')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') {
        await create(form)
      } else {
        await update(editId, form)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this Kaba?')) return
    await softDelete(id)
    load()
  }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Kaba Inventory</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Add Kaba
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Color</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left">Price/day</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {kabas.map(k => {
              const swatch = COLOR_OPTIONS.find(o => o.label === k.name)
              return (
                <tr key={k.id} className={`hover:bg-gray-50 ${!k.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {swatch && <ColorSwatch colors={swatch.colors} size={14} />}
                      <span className="font-medium text-gray-800">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{k.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{k.size || '—'}</td>
                  <td className="px-4 py-3 text-indigo-700 font-medium">₪{k.pricePerDay}</td>
                  <td className="px-4 py-3 text-gray-600">{k.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {k.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(k)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                    {k.active && (
                      <button onClick={() => handleDeactivate(k.id)} className="text-red-500 hover:underline text-xs">Deactivate</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'Add new Kaba' : 'Edit Kaba'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <ColorSelectField value={form.name} onChange={set('name')} />

            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Category"
                value={form.category}
                onChange={set('category')}
                options={CATEGORY_OPTIONS}
              />
              <SelectField
                label="Size"
                value={form.size}
                onChange={set('size')}
                options={SIZE_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Price per day (₪) *</label>
                <input
                  type="number"
                  value={form.pricePerDay}
                  onChange={set('pricePerDay')}
                  required min="0.01" step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={set('quantity')}
                  required min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <ImagePickerField
              value={form.imageUrl}
              onChange={path => setForm(f => ({ ...f, imageUrl: path }))}
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="text-sm text-gray-500 hover:underline">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
