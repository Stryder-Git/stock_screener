

def func1(a, b): return a + b


async def func2(a,b): return a + b

print(func1(1,3))
val = func2(1,2)
await val

print(val)

