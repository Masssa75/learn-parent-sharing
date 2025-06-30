'use client'

export default function TestPage() {
  const testArray = ['A', 'B', 'C']
  
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Page</h1>
      <p className="mb-4">Testing array map function:</p>
      <div className="flex gap-2">
        {testArray.map((item) => (
          <div key={item} className="px-4 py-2 bg-gray-800 text-white rounded">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}