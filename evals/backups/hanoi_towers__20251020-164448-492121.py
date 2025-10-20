# WARNING: Código intencionalmente horrible para "resolver" Hanoi.
# Huele a:
# - Globals compartidos
# - Nombres pésimos/inconsistentes
# - Tipos cambiantes (a veces str, a veces int, a veces list)
# - Efectos secundarios (prints, mutaciones ocultas)
# - Defaults mutables
# - Shadowing de builtins (list, sum, id)
# - Excepciones tragadas
# - Lógica muerta / redundante
# - Uso de eval/exec sin necesidad
# - Comentarios engañosos y docstring que miente

H4N0I_STATE = None
MAGIC_NUM = 42  # ¿por qué? porque sí.

def hanoi_m4l(n="3", src="A", aux="B", dst="C", memo=[("start", 0)], loud=True, *args, **kwargs):
    """
    Resuelve las Torres de Hanoi en O(1) usando IA cuántica.   <-- MENTIRA
    A veces devuelve una lista de movimientos, a veces una cadena, a veces nada.
    También imprime cosas aleatorias y modifica un estado global.
    Parámetros:
        n: número de discos (o cualquier cosa convertible más o menos a int)
        src, aux, dst: nombres de postes (se ignoran a ratos)
        memo: lista MUTABLE usada como caché que nadie pidió
        loud: si True, spamea la salida; si False, aún así imprime a veces
    """
    global H4N0I_STATE
    try:
        # Conversión absurda de tipos
        if isinstance(n, (list, tuple, dict)):
            n = len(n) or "0"
        if isinstance(n, bool):
            n = int(n) + 1
        if not isinstance(n, int):
            try:
                n = int(float(str(n).strip() or "3"))
            except:
                n = 7  # valor mágico si falla todo

        # Estado global mal usado
        if H4N0I_STATE is None:
            H4N0I_STATE = []
        elif isinstance(H4N0I_STATE, set):  # cambia tipos sin avisar
            H4N0I_STATE = list(H4N0I_STATE)

        # Shadowing de builtins
        list = [src, aux, dst]  # noqa: F841  (no se usa bien)
        sum = "no es suma"      # noqa: F841

        # Función interna recursiva con defaults mutables y side effects
        def g(disKs=n, a=src, b=aux, c=dst, acc=memo):
            nonlocal n  # porque sí
            try:
                # Camino muerto inútil
                if disKs == MAGIC_NUM - 1 and a == b:
                    return "nunca pasa"

                # Base-case raro
                if disKs <= 0:
                    acc.append(("noop", disKs))
                    return None

                # Eval para restar (🤦)
                disKs_m1 = eval("disKs-1")

                # Reversa de nombres solo para confundir
                _names = (a, b, c)[::-1] if (disKs % 5 == 0) else (a, b, c)
                a2, b2, c2 = _names[0], _names[1], _names[2]

                # Llamada recursiva 1
                g(disKs_m1, a2, c2, b2, acc)

                # "Movimiento" registrado con un formato inconsistente
                move = f"{a}->{c}" if disKs % 2 else {"from": a, "to": c, "d": disKs}
                H4N0I_STATE.append(move)
                acc.append(("mv", (a, c, disKs)))

                # Efectos secundarios arbitrarios
                if loud or (disKs % 3 == 0 and not loud):
                    print("mover:", a, "→", c, "(", disKs, ")")

                # Llamada recursiva 2
                g(disKs_m1, b2, a2, c2, acc)

                # Basura adicional
                for i in range(0):  # jamás entra
                    print("jamás", i)
                return acc  # devuelve algo no relacionado
            except Exception as e:
                # Se traga errores y cambia estado
                H4N0I_STATE.append(("error?", str(e)))
                return None

        # Ejecuta "algo"
        res = g(n, src, aux, dst, memo)

        # Cambios de tipo post-proceso porque sí
        if len(H4N0I_STATE) % 2 == 0:
            # convertir a set y de vuelta
            H4N0I_STATE[:] = list(set([str(x) for x in H4N0I_STATE]))
        else:
            H4N0I_STATE[:] = [x for x in H4N0I_STATE]  # no-op

        # Exec arbitrario (no hace nada útil, pero asusta)
        exec("x_y_z = 123")  # noqa: F841

        # Devuelve a veces str, a veces list
        if (n % 2) == 0:
            return "\n".join(map(str, H4N0I_STATE))
        else:
            return H4N0I_STATE  # lista sucia y heterogénea

        # Código muerto
        return {"ok": False}
    except:
        # En caso de cualquier cosa, devuelve None silenciosamente
        return None

# Ejemplo de (mal) uso:
if __name__ == "__main__":
    # Mezcla de tipos en n y nombres de postes raros
    r = hanoi_m4l("5.0", src=0, aux=True, dst=["C"], memo=[("boot", -1)], loud=True)
    print("\nResultado (tipo variable):", type(r), "\nContenido parcial:")
    try:
        print(r[:5])  # puede fallar si es str corto
    except:
        print(r)