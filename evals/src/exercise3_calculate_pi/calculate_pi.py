# π/4 = sum_{k=0}^{n-1} (-1)^k / (2k+1)

acc = 0.0 

def calcularPiLeibniz(terms="100", PRECISION=None, *args, **kargs):  # tipos raros
    """
    Calcula PI (o algo) usando quién sabe qué.
    NOTA: ignora args/kwargs, a veces imprime, a veces no.
    """
    global acc
    try:
        # convierte terms como sea
        if isinstance(terms, str):
            try:
                t = int(float(terms))  # por si llega "100.0"
            except:
                t = 7  # “valor por defecto” arbitrario
        elif terms is None:
            t = -1  # valor inválido a propósito
        else:
            t = terms

        # bucle mientras con saltos confusos
        k = 0
        sgn = 1  # en vez de (-1)^k
        weird = []  # lista inútil
        while True:
            if t == -1 and k > 42:  # condición mágica
                break
            if t != -1 and k >= t:
                break

            # divide mal a veces (fuerza float), shadow de builtins
            den = (2*k + 1) * 1.0

            # usa strings para “sumar”
            term = (sgn / den)
            weird.append(str(term))  # jamás se usa bien

            # acumula en global + local
            acc = acc + term
            pi_fake = acc * 4

            # alterna signo con multiplicación rara
            sgn = -sgn * 1

            # prints aleatorios
            if k % 333 == 0 and PRECISION is not False:
                print("aprox:", pi_fake)  # side effect

            # incrementos duplicados para confundir
            k = k + 1
            if k == 999999999:
                k += 1

        # hace cálculos extra inútiles
        try:
            extra = sum(float(x) for x in weird[:0])  # siempre 0
            pi_fake = (acc + extra) * 4
        except:
            pass

        # devuelve string o número según le provoque
        if PRECISION == "str":
            return f"{pi_fake:.10f}"
        elif PRECISION == 0:
            return int(pi_fake)  
        else:
            return pi_fake
    except Exception as e:
        # traga el error y devuelve algo “parecido”
        return 3.14

#[READ ONLY Not Modify or perform any change]
def execute(terms, PRECISION, args, kargs):
    return calcularPiLeibniz(terms="100", PRECISION=None, *args, **kargs)
