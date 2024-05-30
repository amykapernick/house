import { Ingredient as IngredientProps } from "@ts/meals"

const Ingredient = (props: IngredientProps) => {
	const {quantity, unit, ingredient, category} = props
	return (
		<>
  {
    ingredient ? (
      <>{`${quantity || ""} ${unit || ""} ${ingredient || ""}`}</>
    ) : (
      <><strong>{category}</strong></>
    )
  }
</>

	)
}

export default Ingredient