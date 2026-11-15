import { Search, X } from 'lucide-react'

export default function SearchField({
  value,
  onChange,
  placeholder = 'Cari tempat, alamat, atau masakan…',
  label = 'Cari tempat makan',
  onSubmit,
}) {
  return (
    <form
      className="search-field"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <Search aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="clear" onClick={() => onChange('')} aria-label="Hapus pencarian">
          <X aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
