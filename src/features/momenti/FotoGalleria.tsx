import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FotoLightboxGrid }        from './FotoLightbox'
import { FotoUploader }            from './FotoUploader'
import {
  useFotoRicordo,
  useUploadFotoMultiplo,
  useDeleteFotoSingola,
  useSetCoverFoto,
} from '@/hooks/useFoto'
import type { FotoConUrl } from '@/types'

// ============================================================
// FotoGalleria — griglia + lightbox + upload + cover
// ============================================================

interface FotoGalleriaProps {
  ricordoId: string
  viaggioId?: string
}

export function FotoGalleria({ ricordoId, viaggioId }: FotoGalleriaProps) {
  const { data: foto = [], isLoading } = useFotoRicordo(ricordoId)

  const {
    uploadMultipli,
    isLoading: isUploading,
    progress,
    errori: uploadErrori,
  } = useUploadFotoMultiplo(ricordoId, foto.length, viaggioId)

  const { deleteFoto, isLoading: isDeleting } = useDeleteFotoSingola(ricordoId, viaggioId)
  const setCover = useSetCoverFoto(ricordoId, viaggioId)

  const [confirmDelete, setConfirmDelete] = useState<FotoConUrl | null>(null)

  function handleDeleteConfirm() {
    if (!confirmDelete) return
    deleteFoto(confirmDelete)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50">
          Foto {foto.length > 0 && `· ${foto.length}`}
        </h2>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-roamly-g6 animate-pulse" />
          ))}
        </div>
      )}

      {/* Griglia foto con lightbox integrato */}
      {!isLoading && foto.length > 0 && (
        <FotoLightboxGrid
          foto={foto}
          onDelete={setConfirmDelete}
          onSetCover={(f) => setCover.mutate(f.id)}
          isDeleting={isDeleting}
          deletingId={confirmDelete?.id}
        />
      )}

      {/* Errori upload */}
      {uploadErrori.length > 0 && (
        <div className="flex flex-col gap-1">
          {uploadErrori.map((err, i) => (
            <p key={i} className="font-dm-sans text-xs text-red-500">{err}</p>
          ))}
        </div>
      )}

      {/* Uploader */}
      <FotoUploader
        onFiles={uploadMultipli}
        isLoading={isUploading}
        progress={progress}
        multiple={true}
      />

      {/* Dialog conferma eliminazione */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                fixed left-1/2 top-1/2 z-50
                -translate-x-1/2 -translate-y-1/2
                w-[min(340px,calc(100vw-32px))]
                bg-white rounded-2xl shadow-xl p-5
                flex flex-col gap-4
              "
            >
              <div className="text-center">
                <p className="font-lora text-lg font-semibold text-roamly-g0">Elimina foto</p>
                <p className="font-dm-sans text-sm text-roamly-text/60 mt-1">
                  Questa azione non può essere annullata.
                </p>
              </div>
              <img
                src={confirmDelete.thumbnailSignedUrl}
                alt=""
                className="w-full h-32 object-cover rounded-xl"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="
                    flex-1 h-11 rounded-xl font-dm-sans font-medium text-sm
                    bg-roamly-g7 text-roamly-text/70
                    hover:bg-roamly-g6 active:scale-[0.99] transition-all duration-150
                  "
                >
                  Annulla
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="
                    flex-1 h-11 rounded-xl font-dm-sans font-medium text-sm
                    bg-red-500 text-white hover:bg-red-600
                    active:scale-[0.99] disabled:opacity-50 transition-all duration-150
                  "
                >
                  {isDeleting
                    ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                    : 'Elimina'
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
