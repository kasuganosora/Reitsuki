#require sizzle
Rei = (selector,context) ->
	Rei.fn.init(selector,context)

Rei.fn = 
	init = (selector,context)->
		if typeof selector is "function"
			Rei.fn.ready(selector)
