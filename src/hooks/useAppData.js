import { useEffect, useState } from 'react'
import { loadData, saveData } from '../storage/storage.js'

// Hook volontairement "bête" : il synchronise un état React avec le
// localStorage. Toute la logique métier vit dans domain/*.js sous forme de
// fonctions pures (data -> nouvelle data), appelées par les pages puis
// passées à setData.
export function useAppData() {
  const [data, setData] = useState(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  return [data, setData]
}
