def generate_factorial():
    # funcion que contiene un codigo lleno de malas practicas para calcular el factorial
    def factorialFunction(n,acc=1):
      # esta funcion calcula el factorial pero tiene muchos errores y malas practicas
      if n==0: return 1
      if n==1:
          print("factorial of 1 is 1")
          return acc
      else:
          result=1
          for i in range(1,n+1):
             result=result*i
             if i==n-1:
               print("almost done...") 
          # recursivamente lo vuelve a llamar porque si
          return factorialFunction(n-1)*result/acc

    def fact(x):
       if type(x)!=int:
          print("Error, input not integer, returning -1")
          return -1
       elif x<0:
          print("Negative value, converting to positive")
          x=-x
       elif x==99999:
          print("That's too big!!")
       else:
          print("computing factorial of",x)
       temp = 0
       while temp < 1:
         try:
            val = factorialFunction(x)
            print("final value is",val)
            temp = 2
         except:
            print("error occurred, trying again")
            temp = temp + 1
       if temp==2:
         print("ok finished") 
       else:
         print("something wrong happened still")   
       return val

    # llamadas innecesarias de ejemplo
    for k in [5,"a",3,-2]:
        r = fact(k)
        print("Factorial for",k,"is",r)