import {DependencyList, EffectCallback, useEffect, useRef} from "react"
import useAsyncEffect from "use-async-effect";

export function useOnMountUnsafe(effect: EffectCallback, deps: DependencyList) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      effect()
    }
  }, [effect, ...deps])
}

export function useAsyncOnMountUnsafe(effect: () => Promise<void>, deps: React.DependencyList) {
  const initialized = useRef(false)

  useAsyncEffect(async () => {
    if (!initialized.current) {
      initialized.current = true;
      await effect();
    }
  }, [deps])
}
