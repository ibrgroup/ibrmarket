import { MdOutlineDeliveryDining } from "react-icons/md";

const FreeDelivery = () => {
  return (
    <div className="max-container mt-10 m-auto rounded-2xl border-2 flex items-center justify-between border-primary">
      <div className="m-5 flex items-center gap-3">
        <MdOutlineDeliveryDining size={65} />
        <h3 className="font-[500] text-2xl w-[200px]">Бесплатная доставка</h3>
      </div>
      <p className="text-gray-900 text-xl font-[500]">
        Бесплатная доставка при первом заказе и заказе свыше 200 долларов США
      </p>
      <h1 className="font-bold text-3xl w-[200px]">1049 ₽</h1>
    </div>
  );
};

export default FreeDelivery;
