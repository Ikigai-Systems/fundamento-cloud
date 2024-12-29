export const colorNameToClass = (colorName) => {
  switch(colorName) {
  case "green":
    return "!bg-green-500 !text-white"
  case "orange":
    return "!bg-orange-500 !text-white"
  case "blue":
    return "!bg-sky-500 !text-white"
  case "yellow":
    return "!bg-yellow-500 !text-white"
  case "red":
    return "!bg-rose-700 !text-white"
  case "black":
    return "!bg-gray-800 !text-white"
  case "pink":
    return "!bg-pink-500 !text-white"
  case "violet":
    return "!bg-violet-500 !text-white"
  case "white":
  default:
    return "!bg-white !text-slate-800"
  }
}

export const colorNameToHoverAndActiveClass = (colorName) => {
  switch(colorName) {
  case "green":
    return "hover:!bg-green-600"
  case "orange":
    return "hover:!bg-orange-600"
  case "blue":
    return "hover:!bg-sky-600"
  case "yellow":
    return "hover:!bg-yellow-600"
  case "red":
    return "hover:!bg-rose-800"
  case "black":
    return "hover:!bg-gray-900"
  case "pink":
    return "hover:!bg-pink-600"
  case "violet":
    return "hover:!bg-violet-600"
  case "white":
  default:
    return "hover:!bg-neutral-100"
  }
}
