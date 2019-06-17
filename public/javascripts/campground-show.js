		//Layout mode	
		$('#uniform').click(function(){
			$('img').css('height', '8rem');
			$('.card-title').css('height', '4rem');
			$('.starLineHeight').css('height', '3rem');
			$('img').css('object-fit', 'cover');
			// $('.card-body').css('object-fit', 'cover');
		});

		$('#waterfall').click(function(){
			$('img').css('height', 'auto');
			$('.card-title').css('height', 'auto');
			$('.starLineHeight').css('height', 'auto');
		});

		//  $('.clear-rating').click(function(){
		// 	$(this).siblings('.input-no-rate').click();
		// 	$(this).siblings('#rateMessage').text('0 star');;
		// });
		
		//star btn color
		$('#starBtn1').css('color', '#6c757d');
		$('#starBtn2').css('color', '#6c757d');
		$('#starBtn3').css('color', '#6c757d');
		$('#starBtn4').css('color', '#6c757d');
		$('#starBtn5').css('color', '#6c757d');
		
		//star btn hover effect mouse enter
		$('#starBtn1').mouseenter(function(){
			 $(this).css('color', 'orange'); 
		});
		 
		$('#starBtn2').mouseenter(function(){
			 $(this).css('color', 'orange'); 
			$('#starBtn1').css('color', 'orange');
		});
		
		$('#starBtn3').mouseenter(function(){
			 $(this).css('color', 'orange'); 
			$('#starBtn1').css('color', 'orange');
			$('#starBtn2').css('color', 'orange');
		});
		
		$('#starBtn4').mouseenter(function(){
			 $(this).css('color', 'orange'); 
			$('#starBtn1').css('color', 'orange');
			$('#starBtn2').css('color', 'orange');
			$('#starBtn3').css('color', 'orange');
		});
		
		$('#starBtn5').mouseenter(function(){
			 $(this).css('color', 'orange'); 
			$('#starBtn1').css('color', 'orange');
			$('#starBtn2').css('color', 'orange');
			$('#starBtn3').css('color', 'orange');
			$('#starBtn4').css('color', 'orange');
		});
		
		
		///star btn hover effect mouse leave
		$('#starBtn1').mouseleave(function(){
			 $(this).css('color', '#6c757d'); 
		});
		
		$('#starBtn2').mouseleave(function(){
			 $(this).css('color', '#6c757d');
			$('#starBtn1').css('color', '#6c757d');
		});
		
		$('#starBtn3').mouseleave(function(){
			 $(this).css('color', '#6c757d');
			$('#starBtn1').css('color', '#6c757d');
			$('#starBtn2').css('color', '#6c757d');
		});
		
		$('#starBtn4').mouseleave(function(){
			 $(this).css('color', '#6c757d');
			$('#starBtn1').css('color', '#6c757d');
			$('#starBtn2').css('color', '#6c757d');
			$('#starBtn3').css('color', '#6c757d');
		});
		
		$('#starBtn5').mouseleave(function(){
			 $(this).css('color', '#6c757d');
			$('#starBtn1').css('color', '#6c757d');
			$('#starBtn2').css('color', '#6c757d');
			$('#starBtn3').css('color', '#6c757d');
			$('#starBtn4').css('color', '#6c757d');
		});
		
		
		//star btn click event
		$('#starBtn1').click(function(){
			$('#rate1').prop('checked', true);
			$('#rate1').siblings('#rateMessage').text('1 star - Terrible');
		});
		
		$('#starBtn2').click(function(){
			$('#rate2').prop('checked', true);
			$('#rate2').siblings('#rateMessage').text('2 stars - Not good');
		});
		
		$('#starBtn3').click(function(){
			$('#rate3').prop('checked', true);
			$('#rate3').siblings('#rateMessage').text('3 stars - Average');
		});
		
		$('#starBtn4').click(function(){
			$('#rate4').prop('checked', true);
			$('#rate4').siblings('#rateMessage').text('4 stars - Very good');
		});
		
		$('#starBtn5').click(function(){
			$('#rate5').prop('checked', true);
			$('#rate5').siblings('#rateMessage').text('5 stars - Amazing');
		});

		
		// $('#rate1').click(function(){
		// 	$(this).siblings('#rateMessage').text('1 star - Terrible');
		// });
		
		// $('#rate2').click(function(){
		// 	$(this).siblings('#rateMessage').text('2 stars - Not good'); 
		// });
		
		// $('#rate3').click(function(){
		// 	$(this).siblings('#rateMessage').text('3 stars - Average'); 
		// });
		
		// $('#rate4').click(function(){
		// 	$(this).siblings('#rateMessage').text('4 stars - Very good'); 
		// });
		
		// $('#rate5').click(function(){
		// 	$(this).siblings('#rateMessage').text('5 stars - Amazing'); 
		// });
		
		// $('#btn-rate1').click(function(){
		// 	$(this).siblings('#add-review-form1').toggle();
		// });	
		
	

		// $(document).ready(function(){
			//$('#addCampModal').on('shown.bs.modal', function() {
				//$(this).find('#textFocus').focus();
			//});
		//});

	

    