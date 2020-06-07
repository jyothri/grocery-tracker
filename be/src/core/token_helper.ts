import * as jwt from 'jsonwebtoken';

const tokenSecret = process.env.SECRET ? process.env.SECRET : '3ee058420bc2';

export function mintToken(aUsername: string): string {
  return jwt.sign({
    username: aUsername
  }, tokenSecret, {
    expiresIn: '2 days'
  });
}

export function getUserNameFromToken(aToken: string): string {
  const decoded = jwt.verify(aToken, tokenSecret) as any;
  return decoded.username;
}