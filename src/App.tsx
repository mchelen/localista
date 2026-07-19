import { useEffect, useState } from 'react'
import { SiteChrome } from './components/SiteChrome'
import { formatDate } from './lib/format'
import { HomePage } from './pages/HomePage'
import { getDataMeta } from './services/staticData'

export default function App() {
  const [dataSnapshot, setDataSnapshot] = useState<string | undefined>()
  useEffect(() => {
    void getDataMeta().then((meta) => {
      if (meta?.generatedAt) setDataSnapshot(meta.generatedAt)
    })
  }, [])

  return (
    <SiteChrome
      active=""
      footerExtra={
        dataSnapshot && (
          <p>Data snapshot compiled {formatDate(dataSnapshot.slice(0, 10))}.</p>
        )
      }
    >
      <HomePage />
    </SiteChrome>
  )
}
