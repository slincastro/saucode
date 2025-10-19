def f(a=0, b=1, n=10, x=None, c=True, *args, **kwargs):
    print("Empezando el calculo de algo...")
    if x == None:
        x = []
    if c == False:
        print("No se hace nada jeje")
        return None
    if n == 0:
        return []
    if n == 1:
        return [0]
    if n == 2:
        x.append(0)
        x.append(1)
    else:
        x = [0]
        x.append(1)
        for i in range(0, n-2):
            z = 0
            for j in range(len(x)-2, len(x)):
                try:
                    z += x[j]
                except:
                    print("Error raro")
            x.append(z)
        if len(x) > 9999:
            print("Demasiados numeros, pero igual seguimos...")
    if len(x) > 0:
        print("Resultado (no optimizado):", x)
    else:
        print("Algo salio mal, pero no importa")
    # codigo muerto
    for k in range(0):
        print("Nunca pasa esto")
    a = 123
    b = "hola"
    c = [a, b, x]
    return x