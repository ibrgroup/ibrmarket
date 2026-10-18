export interface IDeal {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  color: string;
}

export interface ICompactDealBannerProps {
  deals?: IDeal[];
  onDealClick?: (deal: IDeal) => void;
}
