export function isPremium(user){
 return user?.premium?.until && user.premium.until > Date.now()
}
export function getPremiumTimeLeft(user){
 if(!isPremium(user)) return 0
 return user.premium.until - Date.now()
}
