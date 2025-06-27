'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const categories = [
  { id: 'apps', name: 'Apps & Software', emoji: '📱' },
  { id: 'toys', name: 'Toys & Games', emoji: '🧸' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'education', name: 'Educational Resources', emoji: '🎓' },
  { id: 'activities', name: 'Activities', emoji: '🎨' },
  { id: 'tips', name: 'Parenting Tips', emoji: '💡' }
]

const ageRanges = ['0-2', '3-5', '5-7', '8-10', '11-13', '14+']

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [link, setLink] = useState('')
  
  const handleAgeToggle = (age: string) => {
    setSelectedAges(prev =>
      prev.includes(age)
        ? prev.filter(a => a !== age)
        : [...prev, age]
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API
    console.log({
      title,
      description,
      category,
      selectedAges,
      link
    })
    router.push('/feed')
  }
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10 px-4 py-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-400"
          >
            Cancel
          </button>
          <h1 className="text-lg font-semibold text-white">Share a Discovery</h1>
          <button
            onClick={handleSubmit}
            className="text-brand-green font-medium"
            disabled={!title || !category || selectedAges.length === 0}
          >
            Share
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            What did you find?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="App name, toy, book, technique..."
            className="w-full bg-dark-surface rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl text-left transition-colors ${
                  category === cat.id
                    ? 'bg-brand-green text-black'
                    : 'bg-dark-surface text-gray-400'
                }`}
              >
                <span className="text-xl mr-2">{cat.emoji}</span>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Age Range
          </label>
          <div className="flex flex-wrap gap-2">
            {ageRanges.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => handleAgeToggle(age)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedAges.includes(age)
                    ? 'bg-brand-green text-black'
                    : 'bg-dark-surface text-gray-400'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Tell us about it
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why do you recommend this? How has it helped your child?"
            rows={4}
            className="w-full bg-dark-surface rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-brand-green resize-none"
          />
        </div>
        
        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Add Link (optional)
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-dark-surface rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Add Photo (optional)
          </label>
          <div className="bg-dark-surface border-2 border-dashed border-dark-border rounded-xl p-8 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm">Tap to add photo</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}